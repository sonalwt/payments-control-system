# Payments Control System — Section 1.1

**Entities and Organisational Structure** — full-stack implementation for the SOW.

- Backend: NestJS 10 + TypeORM + PostgreSQL + JWT (`backend/`)
- Frontend: Next.js 14 App Router + Shadcn UI + Tailwind + React Query (`frontend/`)
- Architecture: see [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Quick start

### 1. PostgreSQL

```bash
createdb pcs
psql -d pcs -f backend/src/database/schema.sql
```

This creates every table, index, FK and seeds the system roles and a starter set of currencies.

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit DB_* and JWT_SECRET
npm install
npm run seed                  # creates admin@pcs.local / ChangeMe123! (platform admin)
npm run start:dev             # http://localhost:4000/api/v1
```

Swagger UI: `http://localhost:4000/api/v1/docs`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Open `http://localhost:3000`, sign in with the seeded credentials, and start with **Groups → Legal Entities → Countries → Business Units → Departments**, then assign roles under **User Role Assignment**.

---

## API reference (Section 1.1)

All endpoints sit under `/api/v1` and require `Authorization: Bearer <jwt>` except `POST /auth/login`.

### Auth

| Method | Path           | Body / Notes                                  |
| ------ | -------------- | --------------------------------------------- |
| POST   | `/auth/login`  | `{ email, password }` → `{ accessToken, … }`  |
| GET    | `/auth/me`     | Returns the current `AuthenticatedUser`       |

### Groups (SUPER_ADMIN-only writes)

```http
POST /api/v1/groups
Content-Type: application/json
Authorization: Bearer <jwt>

{ "name": "Acme Holdings", "code": "ACME", "description": "Parent group" }
```

| Method | Path             | Notes                                  |
| ------ | ---------------- | -------------------------------------- |
| GET    | `/groups`        | `?page=1&limit=20&search=acme`         |
| GET    | `/groups/:id`    | Includes `legalEntities[]`             |
| PUT    | `/groups/:id`    | Partial update of name/code/description|
| DELETE | `/groups/:id`    | Fails if legal entities still attached |

### Legal Entities

```json
POST /api/v1/legal-entities
{
  "groupId": "5b6c…",
  "name": "Acme India Pvt Ltd",
  "code": "ACME-IN",
  "registeredCountry": "IN",
  "baseCurrencyId": "94…",
  "taxIdentifier": "29ABCDE1234F1Z5"
}
```

`GET /legal-entities?groupId=…` filters to one group.

### Countries / Business Units / Departments

```json
POST /api/v1/countries          { "legalEntityId": "…", "name": "India", "isoCode": "IN" }
POST /api/v1/business-units     { "countryId": "…", "name": "Retail Banking", "code": "RETAIL" }
POST /api/v1/departments        { "businessUnitId": "…", "name": "Treasury", "code": "TREASURY" }
```

Each supports `GET / GET :id / PUT / DELETE` and respects:

- Unique name & code within the parent
- Deletion blocked while children exist
- Audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`)
- Soft delete (`deleted_at`)

### Users & Roles

```http
POST /api/v1/users
{ "email": "jane@acme.com", "fullName": "Jane Doe", "password": "S3cure!pass" }

GET  /api/v1/roles              # list system + custom roles
POST /api/v1/roles              { "code": "CUSTOM_ROLE", "name": "Custom" }
```

### User Entity Roles (the mapping)

```http
POST /api/v1/user-entity-roles
{
  "userId":         "…uuid…",
  "legalEntityId":  "…uuid…",
  "roleId":         "…uuid (APPROVER)…",
  "effectiveFrom":  "2026-05-24"
}

GET    /api/v1/user-entity-roles/user/:id
PUT    /api/v1/user-entity-roles/:id          { "isActive": false }
DELETE /api/v1/user-entity-roles/:id
```

A given `(user, legal entity, role)` triple is unique. A user can hold any combination
across entities — e.g. `APPROVER` in India + `FINANCE_HEAD` in UAE.

### Audit log

```http
GET /api/v1/audit-logs/:entityType/:entityId
```

Returns up to 200 most recent entries for a single record (Group, LegalEntity, …).

---

## Folder structure

```
payments-control-system/
├── ARCHITECTURE.md
├── README.md
├── backend/
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/                # app, database, jwt
│       ├── common/
│       │   ├── entities/base.entity.ts
│       │   ├── decorators/        # roles, current-user, public, audit
│       │   ├── enums/             # role.enum, audit-action.enum
│       │   ├── guards/            # jwt-auth, roles
│       │   ├── filters/           # http-exception
│       │   ├── interceptors/      # audit
│       │   └── dto/               # pagination
│       ├── database/
│       │   ├── schema.sql         # canonical DDL
│       │   ├── data-source.ts     # for TypeORM CLI / seed
│       │   ├── seed.ts            # bootstrap admin
│       │   └── migrations/
│       └── modules/
│           ├── auth/              # login, JWT strategy
│           ├── users/             # CRUD + me
│           ├── roles/             # CRUD
│           ├── user-entity-roles/ # assignment + revocation
│           ├── groups/            # CRUD + repository
│           ├── legal-entities/    # CRUD
│           ├── countries/         # CRUD
│           ├── business-units/    # CRUD
│           ├── departments/       # CRUD
│           ├── currencies/        # GET (master)
│           └── audit-logs/        # query
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── page.tsx                       # → /dashboard
        │   ├── login/page.tsx
        │   └── (protected)/
        │       ├── layout.tsx                 # AppShell
        │       ├── dashboard/page.tsx
        │       ├── groups/{page,group-form}.tsx
        │       ├── legal-entities/{page,legal-entity-form}.tsx
        │       ├── countries/page.tsx
        │       ├── business-units/page.tsx
        │       ├── departments/page.tsx
        │       ├── users/page.tsx
        │       └── user-roles/page.tsx
        ├── components/
        │   ├── ui/                # button, input, label, dialog, card, table, toast, select, textarea
        │   ├── layout/            # sidebar, breadcrumbs, app-shell, providers
        │   └── shared/            # page-header, data-table-pagination, confirm-delete
        ├── hooks/use-auth.tsx
        ├── lib/{api,utils}.ts
        └── types/domain.ts
```

---

## Setup checklist

- [x] PostgreSQL 14+ running locally
- [x] `pcs` database created
- [x] Apply `backend/src/database/schema.sql`
- [x] Backend `.env` filled in
- [x] `npm install` in `backend/`
- [x] `npm run seed`
- [x] `npm run start:dev`
- [x] Frontend `.env.local` filled in
- [x] `npm install` in `frontend/`
- [x] `npm run dev`
- [x] Sign in at `http://localhost:3000` with seeded admin credentials

---

## Security & compliance notes

- JWT bearer auth (HS256 by default; switch to RS256 for production by providing public/private key files).
- `SUPER_ADMIN`-gated org-structure mutations via `@Roles` + `RolesGuard`.
- `is_platform_admin` flag on `users` is the bootstrap escape-hatch — revoke once real `user_entity_roles` are in place.
- Every state-changing call on a tagged controller writes to `audit_logs` (user, before/after, IP, UA, timestamp).
- Soft deletes via `deleted_at` — `TypeORM` queries filter automatically.
- `class-validator` whitelisting rejects unknown payload fields.
- `helmet`, CORS allowlist, query-failed FK/uniqueness mapping to typed HTTP errors.
- Passwords hashed with `bcrypt` cost 12; the `passwordHash` column is `select: false` and only loaded by `findByEmailWithPassword`.

---

## Roadmap (subsequent SOW sections)

This module establishes the foundation. Sections 1.2 (Payment Types), 1.3 (Counterparty Master), 1.5
(Approval Matrix) and beyond extend the same patterns — services, controllers, audit, RBAC — already in place.
