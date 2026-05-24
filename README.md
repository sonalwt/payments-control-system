# Payments Control System

Full-stack payments control and approval platform covering SOW §1–§8.

- **Backend**: NestJS 10 + TypeORM 0.3 + PostgreSQL + JWT (`backend/`)
- **Frontend**: Next.js 14 App Router + Shadcn UI + Tailwind CSS + React Query (`frontend/`)
- **Architecture**: see [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Quick start (fresh system)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A database named `pcs` (or set `DB_NAME` in `.env`)

```bash
createdb pcs
```

### 1. Backend — install & configure

```bash
cd backend
cp .env.example .env        # fill in DB_*, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
```

### 2. Run migrations

Applies every schema change in the correct order — base schema, sections 6-8,
approval matrices, sanctioned countries, and section 5 payroll tables:

```bash
npm run migration:run
```

### 3. Seed the database

**Minimal** — creates the platform admin user only:

```bash
npm run seed
# Default credentials: admin@pcs.local / ChangeMe123!
# Override: ADMIN_EMAIL=you@company.com ADMIN_PASSWORD=Secret123 npm run seed
```

**Full** — admin user + demo organisations, users, banks, approval matrices,
and beneficiary accounts (useful for local development):

```bash
npm run seed:all
```

**One-shot setup** — migrations + full seed in a single command:

```bash
npm run db:setup
```

### 4. Start the backend

```bash
npm run start:dev           # http://localhost:4000/api/v1
```

Swagger UI: `http://localhost:4000/api/v1/docs`

### 5. Frontend

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                 # http://localhost:3000
```

Sign in with the seeded admin credentials, then configure **Groups → Legal
Entities → Countries → Business Units → Departments**, assign roles under
**User Role Assignment**, and set up **Banks → Currencies → Payment Types**.

---

## npm scripts reference (backend)

| Script | What it does |
|--------|--------------|
| `npm run migration:run` | Applies all pending TypeORM migrations |
| `npm run migration:revert` | Reverts the most recent migration |
| `npm run migration:generate` | Generates a new migration from entity diff |
| `npm run seed` | Seeds platform admin user (idempotent) |
| `npm run seed:all` | Seeds admin + dummy organisations + beneficiary accounts |
| `npm run db:setup` | `migration:run` then `seed:all` — full fresh-system setup |
| `npm run start:dev` | NestJS hot-reload dev server |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint with auto-fix |

---

## Migration order

The migrations in `backend/src/database/migrations/` run in timestamp order:

| Timestamp | Migration | Covers |
|-----------|-----------|--------|
| 1700000000000 | InitialSchema | Base schema: currencies, groups, legal entities, users, roles, payment types, payment requests, etc. (schema.sql §1–§4) |
| 1701000000000 | Section6BeneficiaryAccounts | `beneficiary_accounts`, `beneficiary_account_change_requests`, FK back-fill |
| 1702000000000 | Section7ExceptionReports | `exception_reports`, `exception_report_items` |
| 1703000000000 | Section8VendorPaymentFields | `invoice_number`, `due_date` columns on `payment_requests` |
| 1748000000000 | AddApprovalMatrices | `approval_matrices`, `approval_matrix_bands`, `approval_matrix_steps` |
| 1749000000000 | AddSanctionedCountries | `sanctioned_countries` |
| 1750000000000 | Section5PayrollAndEbac | `payroll_batches`, `payroll_batch_items`, `employee_bank_account_changes` |

> **Note for existing installations**: if you applied `schema.sql` and the
> section SQL files manually before migrations existed, do **not** run
> `migration:run` against that database — it will attempt to recreate tables
> that already exist. Use migrations only for fresh databases.

---

## API reference

All endpoints are under `/api/v1` and require `Authorization: Bearer <jwt>`
except `POST /auth/login`.

### Auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, … }` |
| GET | `/auth/me` | Returns the current `AuthenticatedUser` |

### Organisation structure

| Resource | Base path | Notes |
|----------|-----------|-------|
| Groups | `/groups` | SUPER_ADMIN writes; `?search=` filter |
| Legal Entities | `/legal-entities` | `?groupId=` filter |
| Countries | `/countries` | `?legalEntityId=` |
| Business Units | `/business-units` | `?countryId=` |
| Departments | `/departments` | `?businessUnitId=` |

All support `GET / GET :id / PUT / DELETE` with soft-delete and audit columns.

### Users & Roles

```
POST /users                   { email, fullName, password }
GET  /roles                   list system + custom roles
POST /roles                   { code, name }
POST /user-entity-roles       { userId, legalEntityId, roleId, effectiveFrom }
GET  /user-entity-roles/user/:id
PUT  /user-entity-roles/:id   { isActive: false }
DELETE /user-entity-roles/:id
```

### Payment Requests

```
POST /payment-requests        create (DRAFT)
GET  /payment-requests        paginated list
GET  /payment-requests/:id    detail with approvals + documents
POST /payment-requests/:id/submit
POST /payment-requests/:id/approve
POST /payment-requests/:id/reject   { reason }
POST /payment-requests/:id/cancel
POST /payment-requests/:id/mark-paid
POST /payment-requests/:id/upload-pop  (multipart: file)
```

### Payroll Batches (§5)

```
POST /payroll-batches/upload  multipart: file + periodLabel + currencyCode + legalEntityId
GET  /payroll-batches         paginated list; ?legalEntityId= ?status=
GET  /payroll-batches/:id     detail with items
POST /payroll-batches/:id/submit
POST /payroll-batches/:id/approve
POST /payroll-batches/:id/reject   { reason }
POST /payroll-batches/:id/cancel   { reason }
```

### Employee Bank Account Changes (§5.4)

```
POST /employee-bank-account-changes             create ADD/MODIFY/DEACTIVATE
GET  /employee-bank-account-changes             paginated list; ?employeeId= ?status=
GET  /employee-bank-account-changes/:id         detail
POST /employee-bank-account-changes/:id/verify  checker step (userId ≠ requestedBy)
POST /employee-bank-account-changes/:id/approve applies change to employee record
POST /employee-bank-account-changes/:id/reject  { reason }
POST /employee-bank-account-changes/:id/cancel
```

### Beneficiary Accounts (§6)

```
POST /beneficiary-accounts
GET  /beneficiary-accounts        ?counterpartyId= ?employeeId= ?status=
GET  /beneficiary-accounts/:id
POST /beneficiary-account-change-requests
GET  /beneficiary-account-change-requests
GET  /beneficiary-account-change-requests/:id
POST /beneficiary-account-change-requests/:id/verify
POST /beneficiary-account-change-requests/:id/approve
POST /beneficiary-account-change-requests/:id/reject
POST /beneficiary-account-change-requests/:id/cancel
```

### Exception Reports (§7)

```
GET /exception-reports          paginated list
GET /exception-reports/:id      detail with items
POST /exception-reports/generate  (manual trigger; cron runs nightly at 23:55)
```

### Vendor Payments (§8)

Payment requests with `paymentTypeCode=VENDOR_PAYMENT` require `invoiceNumber`
and `dueDate` in the payload.

### Other masters

```
GET  /currencies
GET  /banks
POST /banks              { name, swiftBic, countryCode }
GET  /counterparties
POST /counterparties
GET  /payment-types
POST /approval-matrices
GET  /approval-matrices
GET  /sanctioned-countries
POST /sanctioned-countries
GET  /uploads/file       (POST multipart — returns { url })
```

---

## Folder structure

```
payments-control-system/
├── README.md
├── ARCHITECTURE.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── config/                  app, database, jwt
│       ├── common/                  guards, decorators, filters, interceptors, dto
│       ├── database/
│       │   ├── schema.sql           canonical DDL reference (do not execute directly on new systems)
│       │   ├── data-source.ts       TypeORM CLI DataSource
│       │   ├── seed.ts              admin user seeder (--all flag adds dummy data)
│       │   ├── seed_dummy.sql       demo organisations, users, banks, matrices
│       │   ├── seed_beneficiary_accounts.sql  demo beneficiary accounts
│       │   ├── migration_section6.sql  (source for 1701 migration)
│       │   ├── migration_section7.sql  (source for 1702 migration)
│       │   ├── migration_section8.sql  (source for 1703 migration)
│       │   └── migrations/
│       │       ├── 1700000000000-InitialSchema.ts
│       │       ├── 1701000000000-Section6BeneficiaryAccounts.ts
│       │       ├── 1702000000000-Section7ExceptionReports.ts
│       │       ├── 1703000000000-Section8VendorPaymentFields.ts
│       │       ├── 1748000000000-AddApprovalMatrices.ts
│       │       ├── 1749000000000-AddSanctionedCountries.ts
│       │       └── 1750000000000-Section5PayrollAndEbac.ts
│       └── modules/
│           ├── auth/
│           ├── users/
│           ├── roles/
│           ├── user-entity-roles/
│           ├── groups/
│           ├── legal-entities/
│           ├── countries/
│           ├── business-units/
│           ├── departments/
│           ├── currencies/
│           ├── banks/
│           ├── counterparties/
│           ├── payment-types/
│           ├── payment-requests/
│           ├── payroll-batches/
│           ├── employee-bank-account-changes/
│           ├── beneficiary-accounts/
│           ├── exception-reports/
│           ├── approval-matrices/
│           ├── sanctioned-countries/
│           ├── uploads/
│           └── audit-logs/
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app/
        │   ├── login/
        │   └── (protected)/
        │       ├── dashboard/
        │       ├── groups/
        │       ├── legal-entities/
        │       ├── countries/
        │       ├── business-units/
        │       ├── departments/
        │       ├── users/
        │       ├── user-roles/
        │       ├── banks/
        │       ├── currencies/
        │       ├── counterparties/
        │       ├── payment-types/
        │       ├── payment-requests/
        │       ├── payroll-batches/
        │       ├── employee-bank-account-changes/
        │       ├── beneficiary-accounts/
        │       ├── exception-reports/
        │       ├── approval-matrices/
        │       ├── sanctioned-countries/
        │       ├── reimbursements/new/
        │       └── fnf-settlements/new/
        ├── components/
        │   ├── ui/
        │   ├── layout/
        │   └── shared/
        ├── hooks/
        ├── lib/
        └── types/domain.ts
```

---

## Setup checklist (fresh system)

- [ ] PostgreSQL 14+ running
- [ ] `createdb pcs` (or set `DB_NAME`)
- [ ] `cd backend && cp .env.example .env` — fill in `DB_*`, `JWT_SECRET`
- [ ] `npm install` in `backend/`
- [ ] `npm run db:setup` — runs all migrations then seeds admin + demo data
- [ ] `npm run start:dev`
- [ ] `cd frontend && cp .env.example .env.local` — set `NEXT_PUBLIC_API_URL`
- [ ] `npm install` in `frontend/`
- [ ] `npm run dev`
- [ ] Sign in at `http://localhost:3000` with seeded credentials

---

## Environment variables (backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `pcs` | Database name |
| `DB_SCHEMA` | `public` | Schema |
| `JWT_SECRET` | _(required)_ | HS256 signing secret |
| `JWT_EXPIRATION` | `86400` | Token lifetime in seconds |
| `ADMIN_EMAIL` | `admin@pcs.local` | Bootstrap admin email |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Bootstrap admin password |
| `PAYROLL_VARIANCE_THRESHOLD_PCT` | `10` | Payroll net variance % that sets `variance_flag` |
| `EBAC_COOLING_OFF_HOURS` | `24` | Hours before a new beneficiary account becomes ACTIVE |
| `PORT` | `4000` | HTTP port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

---

## Security notes

- JWT bearer auth (HS256; switch to RS256 for production).
- `SUPER_ADMIN`-gated org-structure mutations via `@Roles` + `RolesGuard`.
- `is_platform_admin` flag is the bootstrap escape-hatch — revoke once real
  `user_entity_roles` are in place.
- Every state-changing call writes to `audit_logs` (user, before/after, IP, UA, timestamp).
- Soft deletes via `deleted_at` — TypeORM queries filter automatically.
- `class-validator` whitelisting rejects unknown payload fields.
- `helmet`, CORS allowlist, FK/uniqueness errors mapped to typed HTTP responses.
- Passwords hashed with `bcrypt` cost 12; `passwordHash` column has `select: false`.
- Payroll maker-checker: batch uploader cannot approve their own batch.
- EBAC maker-checker: requester cannot verify or approve their own change request.
- Anomaly detection on beneficiary account changes: name mismatch, bank redirection,
  multiple changes within 30 days, terminated employee, open payroll batch.
