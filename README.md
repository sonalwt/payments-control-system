# Payments Control System (PCS)

A role-based payment authorisation platform implementing a maker-checker-approver workflow with multi-level approval matrices.

- **Backend**: NestJS 10 · TypeORM 0.3 · PostgreSQL · JWT (`backend/`)
- **Frontend**: Next.js 14 App Router · Shadcn UI · Tailwind CSS · React Query (`frontend/`)

---

## What is implemented

| Area | Status | Notes |
|------|--------|-------|
| Authentication | Complete | JWT login, `/auth/me`, bcrypt (cost 12) |
| Users | Complete | CRUD, pagination, soft delete, role batch loading |
| Roles | Complete | CRUD, system vs. custom role protection |
| Role Assignment | Complete | Assign / revoke roles per user |
| Legal Entities | Complete | CRUD, active flag |
| Counterparties | Complete | CRUD, country linkage |
| Countries | Complete | CRUD, sanctioned-country flag |
| Currencies | Complete | CRUD |
| Bank Accounts | Complete | Company's own accounts, minimum-balance enforcement |
| Beneficiary Accounts | Complete | Verified accounts with ADD / MODIFY / CLOSE change-request workflow, cooling-off period, sanctions check |
| Payment Types | Complete | Maker / Checker config, document policy, active flag |
| Approval Matrices | Complete | DRAFT → PUBLISHED → SUPERSEDED lifecycle, bands (amount ranges), steps (approver per band) |
| Payment Requests | Complete | Full lifecycle — see flow below |
| File Uploads | Complete | PDF / JPEG / PNG, max 10 MB, served as static assets |
| Anomaly Detection | Complete | Rule-based flags at submit time (amount spike, rapid repeat, recent modify, new account) |

---

## Payment Request Lifecycle

```
DRAFT ──submit──▶ PENDING_APPROVAL ──all steps approved──▶ APPROVED ──release──▶ AWAITING_PAYMENT_CONFIRMATION ──mark-paid──▶ PAID

Any non-terminal status:
  ├─ WITHDRAWN   (maker withdraws)
  ├─ CANCELLED   (SUPER_ADMIN cancels)
  └─ REJECTED    (checker or any matrix approver rejects — maker can resubmit)
```

### Two-phase approval flow

| Phase | Who acts | What happens |
|-------|----------|--------------|
| **Phase 1 — Checker** | Checker (from Payment Type config) | Maker submits → step 1 created for the configured checker. Checker reviews and approves or rejects. |
| **Matrix lookup** | System (automatic) | When checker approves, the system looks up the latest **PUBLISHED** approval matrix for the (Payment Type, Currency) pair. If no matrix exists, approval is blocked until one is published. |
| **Phase 2 — Matrix chain** | Matrix approvers (by role or user) | The band matching the payment amount is found. Approvers for that band are appended as steps 2, 3 … Each must approve in sequence. |
| **Final approval** | Last matrix approver | Request status → **APPROVED**. |

### Rejection & resubmit flow

1. Checker **or** any matrix approver clicks **Reject** — must provide a mandatory reason (min 5 chars).
2. Request → `REJECTED`; rejection reason is shown prominently to the maker.
3. Maker can **edit / replace documents** directly on the rejected-request page (no need to resubmit first).
4. Maker clicks **Resubmit** — old approval chain is deleted, status resets to `DRAFT`.
5. Maker reviews / edits the request, then clicks **Submit** to start a fresh approval chain.

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (project uses 18)

### 1. Create the database

```bash
createdb pcs
```

Then apply the schema migrations located in `backend/src/database/` (SQL files). Run them in order.

### 2. Backend — install & start

```bash
cd backend
cp .env.example .env          # fill in DB_* and JWT_SECRET
npm install
npm run start:dev             # http://localhost:4000/api/v1
```

Swagger UI: `http://localhost:4000/api/v1/docs`

### 3. Frontend — install & start

```bash
cd frontend
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                   # http://localhost:3000
```

Sign in with the admin credentials (default: **`admin@radiant.com`** / **`Radiant@1234`**).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment |
| `PORT` | `4000` | HTTP port |
| `API_PREFIX` | `api/v1` | URL prefix for all routes |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_NAME` | `pcs` | Database name |
| `DB_SCHEMA` | `public` | Schema name |
| `DB_SYNCHRONIZE` | `false` | TypeORM auto-sync — keep `false` |
| `DB_LOGGING` | `false` | Log SQL queries |
| `JWT_SECRET` | *(required)* | HS256 signing secret — change in production |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origins, comma-separated |
| `SMTP_HOST` | *(blank = disabled)* | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | Use TLS |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | — | From address |
| `PAYROLL_VARIANCE_THRESHOLD_PCT` | `10` | % variance before payroll anomaly flag triggers |
| `EBAC_COOLING_OFF_HOURS` | `24` | Hours before a new beneficiary account can receive a payment |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Backend API base URL |

---

## API Reference

All endpoints require `Authorization: Bearer <jwt>` unless stated otherwise.
Base URL: `http://localhost:4000/api/v1`

### Auth

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | `/auth/login` | Public | `{ email, password }` | `{ accessToken, expiresIn, user }` |
| GET | `/auth/me` | Any | — | Current user |

### Users

| Method | Path | Notes |
|--------|------|-------|
| POST | `/users` | SUPER_ADMIN only |
| GET | `/users` | `?page=&limit=&search=` |
| GET | `/users/me` | Any authenticated user |
| GET | `/users/:id` | — |
| PUT | `/users/:id` | SUPER_ADMIN only |
| DELETE | `/users/:id` | Soft delete |

### Roles / User-Role Assignment

| Method | Path | Notes |
|--------|------|-------|
| GET | `/roles` | Any authenticated |
| POST | `/roles` | SUPER_ADMIN only |
| PUT | `/roles/:id` | System roles: code is immutable |
| DELETE | `/roles/:id` | System roles cannot be deleted |
| POST | `/user-roles` | `{ userId, roleId }` |
| GET | `/user-roles/user/:id` | Roles for a user |
| DELETE | `/user-roles/:id` | Revoke |

### Masters (Legal Entities, Counterparties, Currencies, Countries, Bank Accounts, Beneficiary Accounts, Payment Types, Approval Matrices)

Standard CRUD at their respective paths. All require authentication; write operations require appropriate role. See Swagger for full schema.

### Payment Requests

| Method | Path | Who | Notes |
|--------|------|-----|-------|
| POST | `/payment-requests` | Maker | Create as DRAFT |
| GET | `/payment-requests` | Maker (own) / Approver (pending step) | Role-filtered visibility |
| GET | `/payment-requests/:id` | — | Full detail with approvals + documents |
| PUT | `/payment-requests/:id` | Maker | DRAFT only |
| DELETE | `/payment-requests/:id` | Maker | DRAFT only; soft delete |
| POST | `/payment-requests/:id/submit` | Maker | DRAFT → PENDING_APPROVAL; creates checker step |
| POST | `/payment-requests/:id/approve` | Assigned approver | Advances step; on checker approval triggers matrix lookup |
| POST | `/payment-requests/:id/reject` | Assigned approver | Mandatory `comments` (min 5 chars) |
| POST | `/payment-requests/:id/resubmit` | Maker (original) | REJECTED → DRAFT; clears approval chain |
| POST | `/payment-requests/:id/withdraw` | Maker | DRAFT or PENDING_APPROVAL → WITHDRAWN |
| POST | `/payment-requests/:id/release` | Maker | APPROVED → AWAITING_PAYMENT_CONFIRMATION; selects source account |
| POST | `/payment-requests/:id/mark-paid` | Maker | AWAITING → PAID; debits source account balance |
| POST | `/payment-requests/:id/upload-proof` | Maker | Attach proof-of-payment URL |
| POST | `/payment-requests/:id/cancel` | SUPER_ADMIN | Any non-terminal status → CANCELLED |
| POST | `/payment-requests/:id/documents` | Maker | Attach a document (DRAFT or REJECTED) |
| DELETE | `/payment-requests/:id/documents/:docId` | Maker | Remove a document (DRAFT or REJECTED) |

### File Uploads

| Method | Path | Notes |
|--------|------|-------|
| POST | `/uploads/file` | Multipart `file` field; PDF/JPEG/PNG; max 10 MB. Returns `{ url, fileName }` |

Uploaded files are served as static assets at `http://localhost:4000/uploads/<filename>`.

---

## Seeded Users

Default password for all seeded users: **`Radiant@1234`**

| Full name | Email | Role(s) |
|-----------|-------|---------|
| System Administrator | admin@radiant.com | SUPER_ADMIN (platform admin) |
| *(others from authority matrix)* | — | Maker / Checker / Approver roles per payment type |

---

## Folder Structure

```
payments-control-system/
├── README.md
├── backend/
│   ├── src/
│   │   ├── main.ts                    Bootstrap (Helmet, CORS, ValidationPipe, Swagger, static uploads)
│   │   ├── app.module.ts
│   │   ├── config/
│   │   ├── common/
│   │   │   ├── decorators/            @CurrentUser, @Roles, @Public
│   │   │   ├── dto/                   pagination.dto.ts
│   │   │   ├── entities/              base.entity.ts (id, timestamps, soft-delete, audit)
│   │   │   ├── enums/                 role.enum.ts
│   │   │   ├── filters/               http-exception.filter.ts
│   │   │   └── guards/                jwt-auth.guard.ts, roles.guard.ts
│   │   ├── database/                  SQL seed & migration files
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── roles/
│   │       ├── user-roles/
│   │       ├── legal-entities/
│   │       ├── counterparties/
│   │       ├── countries/
│   │       ├── currencies/
│   │       ├── bank-accounts/         Company's own bank accounts
│   │       ├── beneficiary-accounts/  Verified payee accounts + change-request workflow
│   │       ├── payment-types/         Maker/checker config + document policy
│   │       ├── approval-matrices/     Bands (amount ranges) + steps (approvers)
│   │       ├── payment-requests/      Full payment lifecycle + two-phase approval
│   │       │   ├── payment-request.entity.ts
│   │       │   ├── payment-request-approval.entity.ts
│   │       │   ├── payment-request-document.entity.ts
│   │       │   ├── payment-requests.service.ts
│   │       │   ├── payment-requests.controller.ts
│   │       │   └── dto/
│   │       └── uploads/               Multer disk storage controller
│   └── uploads/                       Uploaded files (gitignored)
└── frontend/
    └── src/
        ├── app/
        │   ├── login/
        │   └── (protected)/
        │       ├── layout.tsx          AppShell + auth guard
        │       ├── beneficiary-accounts/
        │       ├── counterparty/
        │       │   ├── banks/
        │       │   └── bank-accounts/
        │       ├── payment-requests/   List, detail, create form
        │       │   ├── page.tsx        List with role-filtered create button
        │       │   ├── [id]/page.tsx   Detail with full action buttons
        │       │   └── payment-request-form.tsx
        │       └── [other masters]/
        ├── components/
        │   ├── ui/                     Shadcn components
        │   ├── layout/                 sidebar, breadcrumbs
        │   └── shared/                 page-header, data-table-pagination
        ├── hooks/
        │   ├── use-auth.tsx
        │   └── use-notify.ts
        ├── lib/
        │   ├── api.ts                  Fetch wrapper, friendlyError(), resolveFileUrl()
        │   ├── roles.ts                hasAnyRole()
        │   └── route-permissions.ts
        └── types/
            └── domain.ts               TypeScript interfaces for all domain models
```

---

## Security Notes

- **JWT HS256** bearer tokens; switch to RS256 for production.
- Passwords hashed with **bcrypt cost 12**; `password_hash` column uses `select: false`.
- `class-validator` whitelist mode rejects unknown payload fields (`forbidNonWhitelisted: true`).
- `helmet` security headers applied globally.
- Configurable CORS allowlist (comma-separated `CORS_ORIGIN`).
- Soft deletes via `deleted_at`; TypeORM adds `WHERE deleted_at IS NULL` automatically on repository queries.
- Database constraint violations (unique, FK) are mapped to user-friendly HTTP errors — raw DB errors are never exposed.
- **Maker-checker separation**: the system enforces that checkers cannot create payment requests, and makers cannot approve their own requests.
- **Sanctions check**: if a beneficiary's country is flagged as sanctioned, a `sanction_warning` is set at submit time and the final approver must provide an explicit override reason.
- **Anomaly detection**: rule-based flags (amount spike, rapid repeat, recent modify, new account) are set at submit time and shown to approvers — they do not block payment but increase visibility.
- **Cooling-off period**: newly activated beneficiary accounts cannot receive payments until the configured hours have elapsed (`EBAC_COOLING_OFF_HOURS`).
- `is_platform_admin` is a bootstrap escape-hatch — revoke (set to `false`) after assigning the `SUPER_ADMIN` role properly.

---

## Setup Checklist

- [ ] PostgreSQL running (version 14+)
- [ ] `createdb pcs` (or update `DB_NAME`)
- [ ] Apply SQL schema files from `backend/src/database/`
- [ ] `cd backend && cp .env.example .env` — fill in `DB_*`, `JWT_SECRET`
- [ ] `npm install && npm run start:dev` in `backend/`
- [ ] `cd frontend && cp .env.example .env.local` — set `NEXT_PUBLIC_API_URL`
- [ ] `npm install && npm run dev` in `frontend/`
- [ ] Sign in at `http://localhost:3000` as `admin@radiant.com`
- [ ] Go to **Masters → Approval Matrices** and publish at least one matrix before testing payment approvals
- [ ] Verify a beneficiary account before creating a payment request

---

## npm Scripts

### Backend

| Script | What it does |
|--------|--------------|
| `npm run start:dev` | NestJS hot-reload dev server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | ESLint with auto-fix |

### Frontend

| Script | What it does |
|--------|--------------|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
