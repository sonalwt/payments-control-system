# Invoice Webhook Integration

How the upstream invoicing application raises payment requests in the Payments
Control System (PCS).

**Part 1** is the API contract — share it with the invoicing app's developers.
**Part 2** is internal: configuration, database changes, and testing.

---

# Part 1 — API contract

## What it does

The invoicing app posts an invoice. PCS resolves the names on it against its own
master data, saves a payment request as a **draft**, and returns the request
number. A PCS user then classifies the draft and submits it into the approval
workflow.

```
Invoicing app ──POST invoice──► PCS
                                 │  resolves vendor / entity / currency / bank account
                                 │  saves a DRAFT (no payment type yet)
                                 │  notifies every eligible maker
     ◄──── PR-2026-00103 ────────┘
                                        a maker opens it, selects the payment
                                        type, reviews, and submits
                                                        │
                                              normal approval workflow
```

**The webhook never chooses the payment type.** The payment type selects the
approval matrix — which is to say, who authorises the money — so a person makes
that decision, never the integration. This is also why there is no
"submit immediately" option.

## Endpoint

```
POST https://<pcs-host>/api/v1/webhooks/invoices
Content-Type: application/json
```

No authentication is currently required. There is exactly one endpoint; there is
no status-polling API.

## Request fields

Every field is required **except `dueDate` and `purposeDescription`**.

| Field | Type | Notes |
|---|---|---|
| `externalInvoiceId` | string | The invoicing app's own invoice id. **Must be stable** — this is the duplicate key |
| `externalSystem` | string | Name of the sending system, e.g. `"invoicing"` |
| `dealId` | string | Trade deal this invoice settles. Recorded on the request so makers and approvers can tie the payment back to the deal |
| `currency` | string | Code or name, e.g. `"AED"` |
| `counterpartyName` | string | Supplier name, matched against the PCS counterparty master |
| `legalEntityName` | string | Name or code of the entity being billed |
| `supplierBankAccount` | object | The account printed on the invoice — see below |
| `amount` | string \| number | `"12500.50"`. No thousands separators, no currency symbol, max 4 decimals |
| `invoiceNumber` | string | Spaces and unsupported characters are normalised automatically |
| `documents` | array | Non-empty. See below |
| `purposeDescription` | string | *Optional.* Free text; the deal reference already identifies the payment |
| `dueDate` | string | *Optional.* `"2026-09-15"` |

### `supplierBankAccount`

| Field | Required | Notes |
|---|---|---|
| `accountName` | yes | Account holder as printed on the invoice |
| `accountNumber` | one of | Required unless `iban` is given |
| `iban` | one of | Required unless `accountNumber` is given |
| `swiftBic` | no | |
| `bankName` | no | |
| `branchName` | no | |
| `countryCode` | no | 2 letters, e.g. `"AE"` |

### `documents`

| Field | Required | Notes |
|---|---|---|
| `fileName` | yes | |
| `fileUrl` | yes | Must be `http(s)`. **PCS stores the link — it does not download the file**, so the URL must stay reachable |
| `documentCode` | no | Defaults to `INVOICE` |
| `documentLabel`, `fileSizeBytes`, `mimeType` | no | |

> **Any field not listed above is rejected with `400`.** In particular
> `paymentTypeName`, `autoSubmit`, `beneficiaryName` and
> `beneficiaryAccountNumber` are not accepted.

## Example

```bash
curl -X POST https://<pcs-host>/api/v1/webhooks/invoices \
  -H 'Content-Type: application/json' \
  -d '{
    "externalInvoiceId": "INV-2026-0501",
    "externalSystem": "invoicing",
    "dealId": "DL-2026-0042",
    "currency": "AED",
    "counterpartyName": "Globex Supplies L.L.C.",
    "legalEntityName": "Radiant World Capital Pte Ltd",
    "supplierBankAccount": {
      "accountName": "Globex Supplies L.L.C.",
      "accountNumber": "1015000123456",
      "iban": "AE070260001015000123456",
      "swiftBic": "EBILAEAD",
      "bankName": "Emirates NBD Bank",
      "countryCode": "AE"
    },
    "amount": "12500.50",
    "invoiceNumber": "INV-2026-0501",
    "dueDate": "2026-09-15",
    "purposeDescription": "Iron ore shipment — March",
    "documents": [
      { "fileName": "INV-2026-0501.pdf",
        "fileUrl": "https://invoicing.example.com/files/INV-2026-0501.pdf",
        "mimeType": "application/pdf" }
    ]
  }'
```

### Success — `200`

```json
{
  "outcome": "CREATED",
  "paymentRequestId": "2d0c2b31-1023-472e-bc78-295e6a2d69ee",
  "requestNumber": "PR-2026-00103",
  "status": "DRAFT",
  "externalInvoiceId": "INV-2026-0501",
  "awaitingPaymentType": true,
  "matched": {
    "currency": "AED",
    "counterparty": "Globex Supplies (TEST-VENDOR-001)",
    "legalEntity": "Radiant World Capital Pte Ltd (RADIANT-WORLD-CAPITAL-PTE-LTD)",
    "beneficiary": "Globex Supplies L.L.C. — ****3456"
  },
  "warnings": ["..."]
}
```

`requestNumber` is the sending system's only handle on the request — store it.
The `matched` block shows exactly which PCS records each name resolved to, and
is worth logging. `warnings` appears only when something needs a human's
attention but did not block creation.

## Responses

| Code | Meaning | What the sender should do |
|---|---|---|
| `200` `outcome: CREATED` | Draft raised | Store `requestNumber`. Done |
| `200` `outcome: DUPLICATE` | This `externalInvoiceId` was already delivered | Treat as success. **Re-sending with changed data does not update the original** |
| `400` | Malformed payload — unknown field, bad amount, missing required field | A bug in the sender. **Do not retry unchanged** |
| `422` | A name did not match PCS master data | **Do not retry in a loop.** PCS admins are notified automatically. Retry once the master data is corrected |
| `503` | The integration is not configured in PCS | Retry with backoff; raise with PCS operations |
| `5xx` / timeout | Transient | Safe to retry — the API is idempotent |

### `422` body

Every unresolved field is reported at once, with near matches where PCS has them:

```json
{
  "issues": [
    { "field": "counterpartyName",
      "value": "Globex Suplies LLC",
      "message": "\"Globex Suplies LLC\" does not match any active record in PCS.",
      "candidates": ["Globex Supplies"] }
  ],
  "statusCode": 422,
  "message": "One or more names on the invoice could not be resolved in PCS.",
  "error": "UnresolvedReferences"
}
```

## Matching rules

**Names** are matched case-insensitively, ignoring extra whitespace. If that
fails, a second pass ignores punctuation, dashes and corporate suffixes (`Ltd`,
`L.L.C.`, `Pte`, `FZE`, …) — so `Globex Supplies L.L.C.` finds `Globex Supplies`.
**A name that matches two records is an error, not a coin flip.**

**Bank accounts** are matched only on `accountNumber` or `iban`, never on name.
If the account is not already on the PCS beneficiary master, the draft is still
created but has no beneficiary attached, a warning is returned, and the supplied
details are recorded on the request for the PCS maker. **PCS never creates a
beneficiary account from an invoice** — new accounts go through the normal KYC
and cooling-off process.

**Duplicates** are keyed on `(externalSystem, externalInvoiceId)`. A redelivery
returns the original request and creates nothing.

**The deal reference** is stored in its own `deal_id` column, shown on the
request, included in the maker's notification and the CSV export, and both
searchable and filterable (`GET /payment-requests?dealId=DL-2026-0042`). It is
not unique — a deal is commonly settled by several invoices.

## Reference data

The sending system cannot guess PCS names, so these must be kept in step.

**Currencies:** `AED` `CHF` `CNH` `EUR` `GBP` `HKD` `SGD` `USD`

**Counterparties and legal entities:** supplied separately — export from PCS.
Legal entities accept either the name or the code.

---

# Part 2 — Internal

## Business rules enforced by PCS

- **Trade payments only.** A maker may classify one of these drafts only as a
  payment type in the `Trade Payments` category (13 of the 24 active types).
  Configurable — see below.
- **Payment type is chosen by a human.** `submit()` rejects any request that
  still has none: *"Select a payment type before submitting this request."*
- **Only an eligible maker may classify.** The chosen payment type must be one
  the actor is a configured Maker for, else `403`.
- **Classifying claims the draft.** Ownership (`created_by`) transfers from the
  integration service account to the maker, who becomes the initiator for edit,
  submit, withdraw and all approval notifications.
- **Counterparty KYC** must be `APPROVED` before the request can be submitted.
  The webhook warns rather than blocking, so the invoice is never lost.
- **The manual flow is unchanged.** Users create and edit payment requests
  exactly as before; none of the above applies to manually created requests.

### Payment types available for classification

```
ANNUAL_SUBS_TRADING_IRON_ORE_RWC   HEDGING_MARGIN_CALLS_QIL   TRADE_BASEMETAL_RWC
ANNUAL_SUBS_TRADING_QIL            HEDGING_MARGIN_CALLS_RWC   TRADE_BASEMETAL_RWC_SA
ANNUAL_SUBS_TRADING_RWC            HEDGING_MARGIN_CALLS_SMC   TRADE_IRON_ORE_QIL
ANNUAL_SUBS_TRADING_SMC            MOVIE_COMPANY_PAYMENTS     TRADE_IRON_ORE_RWC
                                                              TRADE_IRON_ORE_SMC
```

## Who gets notified

The **initiators for the invoice's own legal entity**: active users configured
as Maker on a live `Trade Payments` payment type belonging to that entity. They
receive an in-app notification (`PAYMENT_REQUEST_DRAFT_PENDING`) and see the
draft in the payment requests list under **Awaiting classification**.

A payment type is bound to a single legal entity, so a maker for another entity
could not classify the request anyway — notifying them would be pure noise. The
same rule drives three things, which are deliberately kept identical:

| | Rule |
|---|---|
| Who is notified | initiator for the request's legal entity |
| Who can see the draft | same |
| Which payment types the dropdown offers | user ∩ legal entity ∩ category |

Change one and the other two must change with it — otherwise people are told
about work they cannot see, or see work they cannot action.

No email is sent: an email per invoice to a standing group trains people to
ignore it.

**If no initiator exists for the entity**, nobody could classify the draft, so
platform admins get an `INTEGRATION_NO_INITIATOR` notification instead, naming
the entity. The fix is master data — a payment type for that entity, or a maker
role assigned to someone — not a redelivery.

When an invoice cannot be resolved at all, platform admins instead receive
`INTEGRATION_INVOICE_UNRESOLVED`, deduplicated per invoice so a retrying sender
cannot flood the notification bell.

## Configuration

```ini
# backend/.env
INTEGRATION_MAKER_EMAIL=service.account@example.com
INTEGRATION_PAYMENT_CATEGORY=Trade Payments
```

| Variable | Purpose |
|---|---|
| `INTEGRATION_MAKER_EMAIL` | Service account that integration-created requests are attributed to until a maker claims one. Must be an **active** user; needs no maker role. Empty → the webhook returns `503` |
| `INTEGRATION_PAYMENT_CATEGORY` | Category a maker may classify these drafts into. Matched on `payment_categories.name`. Empty disables the restriction |

Verify both resolve:

```sql
SELECT id, username, is_active FROM users WHERE email = '<INTEGRATION_MAKER_EMAIL>';
SELECT id, name FROM payment_categories WHERE name = 'Trade Payments';
```

## Database changes

Run **before** deploying the code. Both new columns are nullable and dropping
`NOT NULL` is backwards-compatible, so the running version keeps working against
the migrated schema — no downtime window is needed. All statements are
idempotent.

```sql
BEGIN;

-- 1. Notifications & delegations.
--    Already in the repo as migration_delegations_notifications.sql. Verify it
--    is applied in every environment — without it the maker alerts fail, and
--    delegation notifications and the notification bell are already broken.
CREATE TABLE IF NOT EXISTS delegations (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID         NOT NULL REFERENCES users(id),
  delegatee_id UUID         NOT NULL REFERENCES users(id),
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  reason       TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID,
  CONSTRAINT no_self_delegation    CHECK (delegator_id <> delegatee_id),
  CONSTRAINT chk_delegation_dates  CHECK (end_date >= start_date),
  CONSTRAINT chk_delegation_status CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED'))
);
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegatee ON delegations(delegatee_id, status);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id),
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 2. Integration origin + idempotency.
--    backend/src/database/migration_payment_request_external_ref.sql
--    The unique index is what stops a redelivered webhook paying twice.
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS external_source    varchar(50);
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS external_reference varchar(200);

COMMENT ON COLUMN payment_requests.external_source IS
  'Originating system for integration-created requests (e.g. INVOICING).';
COMMENT ON COLUMN payment_requests.external_reference IS
  'Idempotency key from the originating system (its invoice id).';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pr_external_ref
  ON payment_requests (external_source, external_reference)
  WHERE external_reference IS NOT NULL AND deleted_at IS NULL;

-- 3. Payment type becomes optional.
--    backend/src/database/migration_payment_request_integration_draft.sql
ALTER TABLE payment_requests ALTER COLUMN payment_type_id DROP NOT NULL;

COMMENT ON COLUMN payment_requests.payment_type_id IS
  'NULL only for integration-created drafts awaiting classification by a maker.';

-- 4. Trade deal reference.
--    backend/src/database/migration_payment_request_deal_id.sql
--    Not unique: a deal is commonly settled by several invoices.
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS deal_id varchar(100);

COMMENT ON COLUMN payment_requests.deal_id IS
  'Upstream trade deal reference this payment settles. Not unique — a deal may be settled by several invoices.';

CREATE INDEX IF NOT EXISTS idx_pr_deal_id
  ON payment_requests (deal_id)
  WHERE deal_id IS NOT NULL AND deleted_at IS NULL;

COMMIT;
```

### Verify

```sql
-- all four must report is_nullable = YES
SELECT column_name, is_nullable FROM information_schema.columns
 WHERE table_name = 'payment_requests'
   AND column_name IN ('payment_type_id','external_source','external_reference','deal_id');

-- must return both indexes
SELECT indexname FROM pg_indexes
 WHERE tablename = 'payment_requests'
   AND indexname IN ('uq_pr_external_ref','idx_pr_deal_id');

-- must return both
SELECT table_name FROM information_schema.tables
 WHERE table_name IN ('notifications','delegations');
```

There are **no new tables** beyond step 1, and no column for supplier bank
details — unmatched details are appended to `purpose_description`, where the
maker and approvers already read.

`deal_id` is also available to manually created requests: it is an optional
field on the payment request form, not something only the integration can set.

### Reversibility

Step 3 takes a brief `ACCESS EXCLUSIVE` lock but rewrites no rows, so it is fast
at any table size. Restoring `NOT NULL` later would require classifying or
deleting every unclassified draft first.

## Testing

```bash
cd backend
npm run start:dev      # terminal 1
npm run test:webhook   # terminal 2
```

`backend/src/database/test-invoice-webhook.ts` seeds a throwaway vendor, runs
the full flow — creation, idempotency, validation, unknown vendor, unknown bank
account, maker classification, submission, and the untouched manual flow — then
deletes everything it created. Non-zero exit on failure, so it can gate a
deploy. Pass `--keep` to leave the data in place and inspect it in the UI.

Manual UI pass: log in as a maker, confirm the notification bell shows the
alert, filter the payment requests list by **Awaiting classification**, open the
draft, select a payment type, save, and submit.

## Known limitations

- **The endpoint is unauthenticated.** The approval matrix, not this endpoint,
  authorises payment — but anyone who discovers the URL can inject drafts into
  the queue. Adding a shared-secret header is confined to the controller.
- **Notification volume.** Alerts go to every initiator for the entity, which is
  a group rather than a named owner — currently 16–19 people for the larger
  entities. A dedicated triage role would narrow it further; it is one predicate
  in the notification query, the visibility clause and the dropdown filter.
- **Legal entities without payment types.** Most of the 49 entities have none,
  so an invoice naming one produces a draft nobody can classify. It is reported
  to admins rather than failing at the boundary — consider rejecting such
  invoices with a `422` so they bounce back to the sender instead.
- **`@mention` on an unclassified draft** returns no matrix approvers, because
  the lookup joins on payment type. It resolves itself once classified.
- **Reference data is shared manually.** There is no lookup API for the sending
  system to validate names before sending.
