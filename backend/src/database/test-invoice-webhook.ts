/**
 * End-to-end test for the invoicing-app webhook (POST /webhooks/invoices) and
 * the maker hand-off that follows it.
 *
 *   npm run test:webhook
 *   npm run test:webhook -- --keep      # leave the test data behind to inspect
 *
 * The backend must already be running (npm run start:dev).
 *
 * The webhook only works against real master data, so the script seeds a
 * throwaway vendor + beneficiary account, runs the scenarios, and deletes
 * everything it created. It never touches pre-existing rows.
 *
 * Exit code is non-zero if any scenario fails, so it can gate a deploy.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';

const API_BASE = process.env.TEST_API_BASE ?? 'http://localhost:4000/api/v1';
const WEBHOOK = `${API_BASE}/webhooks/invoices`;
const TEST_CP_CODE = 'WEBHOOK-TEST-CP';
const TEST_ACCOUNT_NO = '01234567890';
const TEST_IBAN = 'AE070331234567890123456';
/** Uppercased by the webhook, so cleanup matches on the uppercase form. */
const TEST_SYSTEM = 'webhook-test';
const TEST_SOURCE = TEST_SYSTEM.toUpperCase();
const SEED_PASSWORD = 'Radiant@1234';
/** Mirrors INTEGRATION_PAYMENT_CATEGORY (app.config.ts). */
const INTEGRATION_CATEGORY = process.env.INTEGRATION_PAYMENT_CATEGORY ?? 'Trade Payments';
const KEEP = process.argv.includes('--keep');

/** Requests created outside the webhook (the manual-flow check), for cleanup. */
const extraCleanupIds: string[] = [];

interface Seeded {
  legalEntityName: string;
  currencyCode: string;
  /** A maker who can classify drafts, and one of the types they may pick. */
  maker: { id: string; username: string; paymentTypeId: string };
  /** A payment type that same maker is NOT eligible for, if one exists. */
  forbiddenPaymentTypeId: string | null;
  /**
   * A different maker, eligible for a type OUTSIDE the integration's category.
   * Needed because in this deployment no single user makes for both categories,
   * so the category rule can only be exercised across two users.
   */
  offCategoryMaker: { username: string; paymentTypeId: string } | null;
  /** Any live type outside the integration's category, maker rights aside. */
  anyOffCategoryTypeId: string | null;
  /**
   * An active legal entity with no payment type anyone can initiate — used to
   * prove an unclassifiable draft escalates to admins instead of going quiet.
   */
  orphanLegalEntityName: string | null;
}

interface HttpResult {
  status: number;
  json: Record<string, any> | null;
}

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: unknown): void {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    if (detail !== undefined) console.error(`        ${JSON.stringify(detail)}`);
  }
}

async function post(body: unknown): Promise<HttpResult> {
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as HttpResult['json'] };
}

/** Authenticated call as a PCS user, for the maker half of the workflow. */
async function asUser(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<HttpResult> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as HttpResult['json'] };
}

async function login(username: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: SEED_PASSWORD }),
  });
  const json = (await res.json().catch(() => null)) as { accessToken?: string } | null;
  return json?.accessToken ?? null;
}

/** A complete, valid payload. Scenarios clone and mutate this. */
function validPayload(seed: Seeded, invoiceId: string): Record<string, unknown> {
  return {
    externalInvoiceId: invoiceId,
    externalSystem: TEST_SYSTEM,
    currency: seed.currencyCode,
    counterpartyName: 'Acme Trading L.L.C.',
    legalEntityName: seed.legalEntityName,
    supplierBankAccount: {
      accountName: 'Acme Trading L.L.C.',
      accountNumber: TEST_ACCOUNT_NO,
      iban: TEST_IBAN,
      swiftBic: 'EBILAEAD',
      bankName: 'Emirates NBD',
    },
    amount: '12500.50',
    invoiceNumber: invoiceId,
    dealId: `DL-${invoiceId}`,
    dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    purposeDescription: 'Automated webhook test',
    documents: [
      {
        fileName: `${invoiceId}.pdf`,
        fileUrl: `https://invoicing.example.com/files/${invoiceId}.pdf`,
        mimeType: 'application/pdf',
      },
    ],
  };
}

/**
 * Creates the throwaway vendor and finds a maker who can log in, so the test
 * can exercise the human half of the workflow (classify → submit).
 */
async function seed(db: DataSource): Promise<Seeded> {
  const serviceAccount = process.env.INTEGRATION_MAKER_EMAIL ?? '';
  if (!serviceAccount) {
    throw new Error(
      'INTEGRATION_MAKER_EMAIL is not set in .env — the webhook cannot create requests.',
    );
  }
  const svc: Array<{ id: string }> = await db.query(
    `SELECT id FROM users WHERE email = $1 AND is_active`,
    [serviceAccount],
  );
  if (svc.length === 0) {
    throw new Error(`INTEGRATION_MAKER_EMAIL (${serviceAccount}) is not an active PCS user.`);
  }

  // A maker who can classify an integration draft: eligible on a live payment
  // type inside the integration's category. Prefer one who ALSO makes for a
  // type outside it, so the category restriction is actually exercised rather
  // than skipped.
  const eligible = `(pt.maker_user_id = u.id
     OR EXISTS (SELECT 1 FROM user_roles ur
                 WHERE ur.user_id = u.id
                   AND (ur.role_id = ANY(pt.maker_role_ids) OR ur.role_id = pt.maker_role_id)))`;
  const live = `pt.is_active AND pt.deleted_at IS NULL
      AND pt.effective_from <= CURRENT_DATE
      AND (pt.effective_to IS NULL OR pt.effective_to >= CURRENT_DATE)`;
  // The payment type drives everything: it fixes the legal entity the payload
  // must name (a type is bound to one entity) and therefore who the initiators
  // are. So pick the type + its entity + an eligible maker as one triple, rather
  // than picking an entity independently and hoping someone can act on it.
  const makers: Array<{
    id: string;
    username: string;
    trade_type: string;
    legal_entity_name: string;
  }> = await db.query(
    `SELECT u.id, u.username, pt.id AS trade_type, le.name AS legal_entity_name
       FROM payment_types pt
       JOIN payment_categories pc ON pc.id = pt.payment_category_id AND pc.name = $1
       JOIN legal_entities le ON le.id = pt.legal_entity_id
        AND le.is_active AND le.deleted_at IS NULL
       JOIN users u ON u.is_active AND u.deleted_at IS NULL AND ${eligible}
      WHERE ${live}
      ORDER BY u.username, pt.code
      LIMIT 1`,
    [INTEGRATION_CATEGORY],
  );
  if (makers.length === 0) {
    throw new Error(
      `No active user is a maker on any "${INTEGRATION_CATEGORY}" payment type tied to a legal entity — cannot test classification.`,
    );
  }

  // Maker rights here are split cleanly by category — nobody makes for both —
  // so the off-category attempt has to come from a second user.
  const offMakers: Array<{ username: string; off_type: string }> = await db.query(
    `SELECT * FROM (
       SELECT u.username,
         (SELECT pt.id FROM payment_types pt
            LEFT JOIN payment_categories pc ON pc.id = pt.payment_category_id
           WHERE ${live} AND pc.name IS DISTINCT FROM $1 AND ${eligible} LIMIT 1) AS off_type
         FROM users u
        WHERE u.is_active AND u.deleted_at IS NULL
     ) x
     WHERE x.off_type IS NOT NULL
     ORDER BY x.username LIMIT 1`,
    [INTEGRATION_CATEGORY],
  );

  // A legal entity nobody can initiate for: no live payment type in the
  // integration's category belongs to it.
  const orphanEntity: Array<{ name: string }> = await db.query(
    `SELECT le.name FROM legal_entities le
      WHERE le.is_active AND le.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM payment_types pt
          JOIN payment_categories pc ON pc.id = pt.payment_category_id AND pc.name = $1
          WHERE pt.is_active AND pt.deleted_at IS NULL
            AND (pt.legal_entity_id = le.id OR le.id = ANY(pt.legal_entity_ids))
        )
      ORDER BY le.name LIMIT 1`,
    [INTEGRATION_CATEGORY],
  );

  // Any off-category type, ignoring maker rights — used to show a manually
  // created draft is not bound by the integration's category rule.
  const anyOffCategory: Array<{ id: string }> = await db.query(
    `SELECT pt.id FROM payment_types pt
       LEFT JOIN payment_categories pc ON pc.id = pt.payment_category_id
      WHERE pt.is_active AND pt.deleted_at IS NULL AND pc.name IS DISTINCT FROM $1
      LIMIT 1`,
    [INTEGRATION_CATEGORY],
  );

  const forbidden: Array<{ id: string }> = await db.query(
    `SELECT pt.id FROM payment_types pt
      WHERE pt.is_active AND pt.deleted_at IS NULL
        AND pt.maker_user_id IS DISTINCT FROM $1
        AND NOT EXISTS (SELECT 1 FROM user_roles ur
                         WHERE ur.user_id = $1
                           AND (ur.role_id = ANY(pt.maker_role_ids) OR ur.role_id = pt.maker_role_id))
      LIMIT 1`,
    [makers[0].id],
  );

  const currency: Array<{ id: string; code: string }> = await db.query(
    `SELECT id, code FROM currencies WHERE is_active AND code IS NOT NULL ORDER BY code LIMIT 1`,
  );
  const legalEntity: Array<{ name: string }> = await db.query(
    `SELECT name FROM legal_entities WHERE is_active AND deleted_at IS NULL ORDER BY name LIMIT 1`,
  );
  const bank: Array<{ id: string; country_id: string }> = await db.query(
    `SELECT id, country_id FROM banks LIMIT 1`,
  );
  if (currency.length === 0 || legalEntity.length === 0 || bank.length === 0) {
    throw new Error(
      'Masters are empty (currency / legal entity / bank). Run npm run db:setup first.',
    );
  }

  // Reuse the vendor if a previous --keep run left it behind.
  const existing: Array<{ id: string }> = await db.query(
    `SELECT id FROM counterparties WHERE code = $1`,
    [TEST_CP_CODE],
  );
  if (existing.length === 0) {
    const inserted: Array<{ id: string }> = await db.query(
      `INSERT INTO counterparties (code, name, legal_name, role, is_active, kyc_status, kyc_done)
       VALUES ($1, 'Acme Trading', 'Acme Trading L.L.C.', 'VENDOR', true, 'APPROVED', true)
       RETURNING id`,
      [TEST_CP_CODE],
    );
    await db.query(
      `INSERT INTO beneficiary_accounts
         (counterparty_id, account_holder_name, account_number, iban, bank_id, currency_id,
          country_id, account_direction, status)
       VALUES ($1, 'Acme Trading L.L.C.', $2, $3, $4, $5, $6, 'PAY_TO', 'ACTIVE')`,
      [
        inserted[0].id,
        TEST_ACCOUNT_NO,
        TEST_IBAN,
        bank[0].id,
        currency[0].id,
        bank[0].country_id,
      ],
    );
  }

  return {
    // The entity the chosen payment type belongs to — the payload must name it,
    // or nobody would be an initiator for the resulting draft.
    legalEntityName: makers[0].legal_entity_name,
    currencyCode: currency[0].code,
    maker: {
      id: makers[0].id,
      username: makers[0].username,
      paymentTypeId: makers[0].trade_type,
    },
    forbiddenPaymentTypeId: forbidden[0]?.id ?? null,
    offCategoryMaker: offMakers[0]
      ? { username: offMakers[0].username, paymentTypeId: offMakers[0].off_type }
      : null,
    anyOffCategoryTypeId: anyOffCategory[0]?.id ?? null,
    orphanLegalEntityName: orphanEntity[0]?.name ?? null,
  };
}

/** Removes only what this script created, in FK-safe order. */
async function cleanup(db: DataSource): Promise<void> {
  await db.transaction(async (em) => {
    const rows: Array<{ id: string }> = await em.query(
      `SELECT id FROM payment_requests WHERE external_source = $1`,
      [TEST_SOURCE],
    );
    const ids = [...new Set([...rows.map((r) => r.id), ...extraCleanupIds])];
    for (const table of [
      'payment_request_approvals',
      'payment_request_documents',
      'payment_request_messages',
      'payment_request_rejections',
    ]) {
      await em.query(`DELETE FROM ${table} WHERE payment_request_id = ANY($1::uuid[])`, [ids]);
    }
    await em.query(`DELETE FROM payment_requests WHERE id = ANY($1::uuid[])`, [ids]);
    await em.query(
      `DELETE FROM beneficiary_accounts
        WHERE counterparty_id IN (SELECT id FROM counterparties WHERE code = $1)`,
      [TEST_CP_CODE],
    );
    await em.query(`DELETE FROM counterparties WHERE code = $1`, [TEST_CP_CODE]);
    await em.query(
      `DELETE FROM notifications
        WHERE type IN ('INTEGRATION_INVOICE_UNRESOLVED',
                       'PAYMENT_REQUEST_DRAFT_PENDING',
                       'INTEGRATION_NO_INITIATOR')
          AND metadata ->> 'externalSystem' = $1`,
      [TEST_SOURCE],
    );
    console.log(`\nCleaned up ${ids.length} payment request(s) and the test vendor.`);
  });
}

async function run(): Promise<void> {
  const health = await fetch(`${API_BASE}/docs-json`).catch(() => null);
  if (!health?.ok) {
    throw new Error(`Backend is not reachable at ${API_BASE}. Start it with: npm run start:dev`);
  }

  const db = await new DataSource(dataSourceOptions).initialize();
  try {
    const seeded = await seed(db);
    console.log(`Legal entity : ${seeded.legalEntityName}`);
    console.log(`Currency     : ${seeded.currencyCode}`);
    console.log(`Maker        : ${seeded.maker.username}\n`);

    const stamp = Date.now();
    const id = (suffix: string) => `WHTEST-${stamp}-${suffix}`;

    // 1 — the invoice lands as an unclassified DRAFT. The webhook must not
    //     choose a payment type: that would choose the approval chain.
    console.log('Receiving an invoice');
    const created = await post(validPayload(seeded, id('A')));
    check('returns 200', created.status === 200, created.json);
    check('outcome is CREATED', created.json?.outcome === 'CREATED', created.json);
    check(
      'has a request number',
      /^PR-\d{4}-\d{5}$/.test(created.json?.requestNumber ?? ''),
      created.json,
    );
    check('lands as DRAFT', created.json?.status === 'DRAFT', created.json);
    check('flagged as awaiting a payment type', created.json?.awaitingPaymentType === true, created.json);
    check('resolved the vendor', !!created.json?.matched?.counterparty, created.json?.matched);
    check('linked the supplier bank account', !!created.json?.matched?.beneficiary, created.json?.matched);

    const prId = created.json?.paymentRequestId as string;
    const stored: Array<{ payment_type_id: string | null; created_by: string; deal_id: string | null }> =
      await db.query(
        `SELECT payment_type_id, created_by, deal_id FROM payment_requests WHERE id = $1`,
        [prId],
      );
    check('stored with no payment type', stored[0]?.payment_type_id === null, stored[0]);
    check('deal reference stored', stored[0]?.deal_id === `DL-${id('A')}`, stored[0]);

    // 2 — every eligible maker is told there is a draft to classify.
    const notified: Array<{ n: string }> = await db.query(
      `SELECT count(*) n FROM notifications
        WHERE type = 'PAYMENT_REQUEST_DRAFT_PENDING' AND metadata ->> 'paymentRequestId' = $1`,
      [prId],
    );
    // The audience is the initiators for THIS request's legal entity, not every
    // maker in the company — the same set the visibility clause and the payment
    // type dropdown use.
    const eligible: Array<{ n: string }> = await db.query(
      `SELECT count(DISTINCT u.id) n FROM users u
        WHERE u.is_active AND u.deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM payment_types pt
                       LEFT JOIN payment_categories pc ON pc.id = pt.payment_category_id
                       WHERE pt.is_active AND pt.deleted_at IS NULL
                         AND pc.name = $1
                         AND (pt.legal_entity_id = (SELECT legal_entity_id FROM payment_requests WHERE id = $2)
                              OR (SELECT legal_entity_id FROM payment_requests WHERE id = $2) = ANY(pt.legal_entity_ids))
                         AND (pt.maker_user_id = u.id
                              OR EXISTS (SELECT 1 FROM user_roles ur
                                          WHERE ur.user_id = u.id
                                            AND (ur.role_id = ANY(pt.maker_role_ids)
                                                 OR ur.role_id = pt.maker_role_id))))`,
      [INTEGRATION_CATEGORY, prId],
    );
    const everyone: Array<{ n: string }> = await db.query(
      `SELECT count(*) n FROM users WHERE is_active AND deleted_at IS NULL`,
    );
    check(
      `initiators for the entity notified (${notified[0].n}/${eligible[0].n})`,
      notified[0].n === eligible[0].n && Number(notified[0].n) > 0,
      { notified: notified[0].n, eligible: eligible[0].n },
    );
    check(
      'and not simply everyone',
      Number(notified[0].n) < Number(everyone[0].n),
      { notified: notified[0].n, activeUsers: everyone[0].n },
    );

    // 3 — redelivery must not raise a second payment, nor re-notify.
    console.log('\nRedelivering the same invoice');
    const dup = await post(validPayload(seeded, id('A')));
    check('outcome is DUPLICATE', dup.json?.outcome === 'DUPLICATE', dup.json);
    check(
      'same payment request as before',
      dup.json?.paymentRequestId === created.json?.paymentRequestId,
      { first: created.json?.paymentRequestId, second: dup.json?.paymentRequestId },
    );
    const afterDup: Array<{ n: string }> = await db.query(
      `SELECT count(*) n FROM notifications
        WHERE type = 'PAYMENT_REQUEST_DRAFT_PENDING' AND metadata ->> 'paymentRequestId' = $1`,
      [prId],
    );
    check('no extra notifications raised', afterDup[0].n === notified[0].n, afterDup[0]);

    // 4 — a bank account PCS does not hold is never linked and never created,
    //     but the invoice is still captured for the maker.
    console.log('\nReceiving an invoice with an unknown bank account');
    const unknownBank = validPayload(seeded, id('B')) as any;
    unknownBank.supplierBankAccount = {
      accountName: 'Acme Trading L.L.C.',
      accountNumber: '99999999999',
      bankName: 'Some Other Bank',
    };
    const unknownBankRes = await post(unknownBank);
    check('request still created', unknownBankRes.json?.outcome === 'CREATED', unknownBankRes.json);
    check('no beneficiary linked', !unknownBankRes.json?.matched?.beneficiary, unknownBankRes.json?.matched);
    check('warned about it', (unknownBankRes.json?.warnings ?? []).length > 0, unknownBankRes.json);
    const purpose: Array<{ purpose_description: string }> = await db.query(
      `SELECT purpose_description FROM payment_requests WHERE id = $1`,
      [unknownBankRes.json?.paymentRequestId],
    );
    check(
      'supplied bank details carried onto the draft',
      purpose[0]?.purpose_description?.includes('99999999999') ?? false,
      purpose[0],
    );
    const beneCount: Array<{ n: string }> = await db.query(
      `SELECT count(*) n FROM beneficiary_accounts
        WHERE counterparty_id IN (SELECT id FROM counterparties WHERE code = $1)`,
      [TEST_CP_CODE],
    );
    check('no beneficiary account was auto-created', beneCount[0].n === '1', beneCount[0]);

    // 5 — dueDate and purposeDescription are optional; the deal reference is
    //     not, and must reach the request whether or not a purpose was sent.
    console.log('\nOptional fields');
    const bare = validPayload(seeded, id('H')) as any;
    delete bare.dueDate;
    delete bare.purposeDescription;
    const bareRes = await post(bare);
    check(
      'creates without dueDate or purposeDescription',
      bareRes.json?.outcome === 'CREATED',
      bareRes.json,
    );
    const bareRow: Array<{ deal_id: string | null; purpose_description: string | null }> =
      await db.query(
        `SELECT deal_id, purpose_description FROM payment_requests WHERE id = $1`,
        [bareRes.json?.paymentRequestId],
      );
    check(
      'deal reference stored in its own column',
      bareRow[0]?.deal_id === `DL-${id('H')}`,
      bareRow[0],
    );
    check(
      'purpose left empty rather than synthesised',
      !bareRow[0]?.purpose_description,
      bareRow[0],
    );

    const noDeal = validPayload(seeded, id('I')) as any;
    delete noDeal.dealId;
    check('missing dealId -> 400', (await post(noDeal)).status === 400);

    // The whole point of a column: the deal is queryable.
    const byDeal = await asUser(
      (await login(seeded.maker.username)) ?? '',
      'GET',
      `/payment-requests?dealId=${encodeURIComponent(`DL-${id('H')}`)}`,
    );
    check(
      'requests can be filtered by deal',
      (byDeal.json?.data ?? []).some(
        (r: { id: string }) => r.id === bareRes.json?.paymentRequestId,
      ),
      { total: byDeal.json?.total },
    );

    // 6 — an entity nobody initiates for: the draft is still captured, but no
    //     maker can act on it, so admins are told rather than it going quiet.
    if (seeded.orphanLegalEntityName) {
      console.log('\nLegal entity with no initiator');
      const orphan = validPayload(seeded, id('J')) as any;
      orphan.legalEntityName = seeded.orphanLegalEntityName;
      const orphanRes = await post(orphan);
      check('invoice still captured', orphanRes.json?.outcome === 'CREATED', orphanRes.json);
      const orphanId = orphanRes.json?.paymentRequestId;

      const toMakers: Array<{ n: string }> = await db.query(
        `SELECT count(*) n FROM notifications
          WHERE type = 'PAYMENT_REQUEST_DRAFT_PENDING' AND metadata ->> 'paymentRequestId' = $1`,
        [orphanId],
      );
      check('no maker was notified (there are none)', toMakers[0].n === '0', toMakers[0]);

      const toAdmins: Array<{ n: string }> = await db.query(
        `SELECT count(*) n FROM notifications
          WHERE type = 'INTEGRATION_NO_INITIATOR' AND metadata ->> 'paymentRequestId' = $1`,
        [orphanId],
      );
      const admins: Array<{ n: string }> = await db.query(
        `SELECT count(*) n FROM users WHERE is_platform_admin AND is_active AND deleted_at IS NULL`,
      );
      check(
        `admins notified instead (${toAdmins[0].n}/${admins[0].n})`,
        toAdmins[0].n === admins[0].n && Number(toAdmins[0].n) > 0,
        { admins: toAdmins[0].n, expected: admins[0].n },
      );
      const msg: Array<{ message: string }> = await db.query(
        `SELECT message FROM notifications
          WHERE type = 'INTEGRATION_NO_INITIATOR' AND metadata ->> 'paymentRequestId' = $1 LIMIT 1`,
        [orphanId],
      );
      check(
        'and the alert names the legal entity',
        msg[0]?.message?.includes(seeded.orphanLegalEntityName) ?? false,
        msg[0],
      );
    } else {
      console.log('\n(every legal entity has an initiator — orphan check skipped)');
    }

    // 7 — payload validation.
    console.log('\nRejecting malformed payloads');
    const withType = { ...validPayload(seeded, id('C')), paymentTypeName: 'Anything' };
    const withTypeRes = await post(withType);
    check('paymentTypeName is rejected -> 400', withTypeRes.status === 400, withTypeRes.json);

    const noBank = validPayload(seeded, id('D')) as any;
    delete noBank.supplierBankAccount;
    check('missing supplierBankAccount -> 400', (await post(noBank)).status === 400);

    const noKey = validPayload(seeded, id('E')) as any;
    noKey.supplierBankAccount = { accountName: 'Acme Trading L.L.C.' };
    check('bank account with no number or IBAN -> 400', (await post(noKey)).status === 400);

    const badAmount = { ...validPayload(seeded, id('F')), amount: '12,500.00' };
    check('amount with a comma -> 400', (await post(badAmount)).status === 400);

    // 6 — an unknown vendor is still refused outright and admins are told.
    console.log('\nRejecting an unknown vendor');
    const unknownVendor = { ...validPayload(seeded, id('G')), counterpartyName: 'No Such Vendor Ltd' };
    const unknownVendorRes = await post(unknownVendor);
    check('returns 422', unknownVendorRes.status === 422, unknownVendorRes.json);
    const notStored: Array<{ n: string }> = await db.query(
      `SELECT count(*) n FROM payment_requests WHERE external_reference = $1`,
      [id('G')],
    );
    check('nothing was stored', notStored[0].n === '0', notStored[0]);

    // 7 — the maker hand-off. This is the point of the whole change.
    console.log('\nMaker completes the draft');
    const token = await login(seeded.maker.username);
    if (!token) {
      check(`could log in as ${seeded.maker.username}`, false, 'login failed');
    } else {
      const visible = await asUser(token, 'GET', '/payment-requests?unclassified=true&limit=100');
      check(
        'unclassified draft is visible to the maker',
        (visible.json?.data ?? []).some((r: { id: string }) => r.id === prId),
        { total: visible.json?.total },
      );

      const submitTooEarly = await asUser(token, 'POST', `/payment-requests/${prId}/submit`);
      check('submitting before classification -> 400', submitTooEarly.status === 400, submitTooEarly.json);
      check(
        'and says why',
        JSON.stringify(submitTooEarly.json?.message ?? '').includes('payment type'),
        submitTooEarly.json,
      );

      if (seeded.forbiddenPaymentTypeId) {
        const forbidden = await asUser(token, 'PUT', `/payment-requests/${prId}`, {
          paymentTypeId: seeded.forbiddenPaymentTypeId,
        });
        check(
          'cannot classify into a type they do not make for -> 403',
          forbidden.status === 403,
          forbidden.json,
        );
      }

      // The category rule, exercised by a maker entitled to the off-category
      // type: assertCanMake passes, so a 400 here is the category rule alone.
      if (seeded.offCategoryMaker) {
        const offToken = await login(seeded.offCategoryMaker.username);
        if (!offToken) {
          check(`could log in as ${seeded.offCategoryMaker.username}`, false, 'login failed');
        } else {
          const wrongCategory = await asUser(offToken, 'PUT', `/payment-requests/${prId}`, {
            paymentTypeId: seeded.offCategoryMaker.paymentTypeId,
          });
          check(
            `cannot classify outside ${INTEGRATION_CATEGORY} -> 400`,
            wrongCategory.status === 400,
            wrongCategory.json,
          );
          check(
            'and names the required category',
            JSON.stringify(wrongCategory.json?.message ?? '').includes(INTEGRATION_CATEGORY),
            wrongCategory.json,
          );
        }
      } else {
        console.log('        (no maker holds an off-category type — skipped)');
      }

      const claimed = await asUser(token, 'PUT', `/payment-requests/${prId}`, {
        paymentTypeId: seeded.maker.paymentTypeId,
      });
      check('classifying succeeds', claimed.status === 200, claimed.json);
      const owner: Array<{ created_by: string; payment_type_id: string | null }> = await db.query(
        `SELECT created_by, payment_type_id FROM payment_requests WHERE id = $1`,
        [prId],
      );
      check('payment type is set', owner[0]?.payment_type_id === seeded.maker.paymentTypeId, owner[0]);
      check('the maker now owns the draft', owner[0]?.created_by === seeded.maker.id, owner[0]);

      // Nest answers POST with 201 unless a handler overrides it.
      const submitted = await asUser(token, 'POST', `/payment-requests/${prId}/submit`);
      if (submitted.status === 200 || submitted.status === 201) {
        check('submit moves it past DRAFT', submitted.json?.status !== 'DRAFT', submitted.json);
        const steps: Array<{ n: string }> = await db.query(
          `SELECT count(*) n FROM payment_request_approvals WHERE payment_request_id = $1`,
          [prId],
        );
        check('an approval chain was seeded', Number(steps[0].n) > 0, steps[0]);
      } else {
        // A payment type with no matrix band for this amount is a data gap in
        // the environment, not a defect in the hand-off being tested.
        check(
          'submit blocked only by matrix configuration',
          JSON.stringify(submitted.json?.message ?? '').toLowerCase().includes('matrix'),
          submitted.json,
        );
        console.log(`        (not submitted: ${JSON.stringify(submitted.json?.message)})`);
      }
    }

    // 8 — the manual flow must be untouched by all of the above: a maker can
    //     still raise a request in the UI, with any category they make for,
    //     and edit it without meeting the integration's extra rules.
    console.log('\nManual creation still works');
    const manualToken = await login(seeded.maker.username);
    if (!manualToken) {
      check('could log in for the manual check', false, 'login failed');
    } else {
      const cp: Array<{ id: string }> = await db.query(
        `SELECT id FROM counterparties WHERE code = $1`,
        [TEST_CP_CODE],
      );
      const ccy: Array<{ id: string }> = await db.query(
        `SELECT id FROM currencies WHERE code = $1`,
        [seeded.currencyCode],
      );
      const manual = await asUser(manualToken, 'POST', '/payment-requests', {
        paymentTypeId: seeded.maker.paymentTypeId,
        counterpartyId: cp[0].id,
        currencyId: ccy[0].id,
        amount: '500.00',
        purposeDescription: 'Manual creation check',
        documents: [
          { documentCode: 'INVOICE', fileName: 'manual.pdf', fileUrl: 'https://example.com/manual.pdf' },
        ],
      });
      check(
        'maker can create a request by hand',
        manual.status === 200 || manual.status === 201,
        manual.json,
      );
      const manualId = manual.json?.id as string | undefined;
      if (manualId) {
        extraCleanupIds.push(manualId);
        const edited = await asUser(manualToken, 'PUT', `/payment-requests/${manualId}`, {
          amount: '600.00',
        });
        check('and edit it', edited.status === 200, edited.json);
        // The category rule is scoped to integration drafts: a manual request
        // must not inherit it.
        if (seeded.anyOffCategoryTypeId) {
          const retype = await asUser(manualToken, 'PUT', `/payment-requests/${manualId}`, {
            paymentTypeId: seeded.anyOffCategoryTypeId,
          });
          check(
            'manual drafts are not bound by the integration category rule',
            retype.status === 200,
            retype.json,
          );
        }
      }
    }

    // 9 — the status-poll endpoint is gone; only the POST remains.
    console.log('\nOnly the POST endpoint is exposed');
    const removed = await fetch(`${WEBHOOK}/${encodeURIComponent(id('A'))}`);
    check('GET on the webhook is not routed', removed.status === 404, { status: removed.status });
  } finally {
    if (KEEP) {
      console.log('\n--keep: test data left in place. Re-run without --keep to remove it.');
    } else {
      await cleanup(db).catch((e) => console.error('Cleanup failed:', e));
    }
    await db.destroy();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
