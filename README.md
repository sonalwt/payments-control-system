# Payments Control System

Role-based user management platform for the Radiant approval authority matrix.

- **Backend**: NestJS 10 + TypeORM 0.3 + PostgreSQL + JWT (`backend/`)
- **Frontend**: Next.js 14 App Router + Shadcn UI + Tailwind CSS + React Query (`frontend/`)

---

## What is currently implemented

| Area | Status | Details |
|------|--------|---------|
| Authentication | Complete | JWT login, `/auth/me`, bcrypt password hashing |
| Users | Complete | CRUD, pagination, soft delete, role batch loading |
| Roles | Complete | CRUD, system vs. custom role protection |
| Role Assignment | Complete | Assign / revoke roles per user (no legal-entity dimension) |
| Sidebar | Simplified | Only **Users** and **Roles** nav items |

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL 18+ (adjust version as needed)

### 1. Create the database and schema

Connect with psql and run the three table definitions manually:

```sql
-- users
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  employee_code   VARCHAR(50) UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID,
  updated_by      UUID
);

-- roles
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- user_roles
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);
```

> **No migrations are used.** The schema is managed directly via SQL.

### 2. Seed roles

```sql
INSERT INTO roles (code, name, description, is_system) VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'Full platform access', TRUE),
  ('INITIATOR',   'Initiator',           'Submits payment requests', FALSE),
  ('CHECKER',     'Checker',             'Verifies payment requests', FALSE),
  ('APPROVER_1',  'Approver Level 1',    'First-level approver', FALSE),
  ('APPROVER_2',  'Approver Level 2',    'Second-level approver', FALSE);
```

### 3. Seed the admin user

Generate a bcrypt hash for your chosen password (cost 12), then insert:

```sql
INSERT INTO users (email, password_hash, full_name, is_active, is_platform_admin)
VALUES (
  'admin@radiant.com',
  '<bcrypt-hash-of-your-password>',
  'System Administrator',
  TRUE,
  TRUE
);
```

Default password used during initial seeding: **`Radiant@1234`**

> Assign the `SUPER_ADMIN` role to this user via the Role Assignment page after first login,
> or insert directly into `user_roles`.

### 4. Backend — install & start

```bash
cd backend
cp .env.example .env          # fill in DB_* and JWT_SECRET
npm install
npm run start:dev             # http://localhost:4000/api/v1
```

Swagger UI: `http://localhost:4000/api/v1/docs`

### 5. Frontend — install & start

```bash
cd frontend
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                   # http://localhost:3000
```

Sign in with the admin credentials, then use the **Roles** page to assign roles to users.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment |
| `PORT` | `4000` | HTTP port |
| `API_PREFIX` | `api/v1` | URL prefix for all routes |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `pcs` | Database name |
| `DB_SCHEMA` | `public` | Schema name |
| `DB_SYNCHRONIZE` | `false` | TypeORM auto-sync (keep false) |
| `DB_LOGGING` | `false` | Log SQL queries |
| `JWT_SECRET` | *(required)* | HS256 signing secret — change in production |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin(s), comma-separated |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Backend API base URL |

---

## npm scripts (backend)

| Script | What it does |
|--------|--------------|
| `npm run start:dev` | NestJS hot-reload dev server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | ESLint with auto-fix |

---

## API reference

All endpoints require `Authorization: Bearer <jwt>` except `POST /auth/login`.
Base URL: `http://localhost:4000/api/v1`

### Auth

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | `/auth/login` | Public | `{ email, password }` | `{ accessToken, expiresIn, user }` |
| GET | `/auth/me` | Any role | — | Current authenticated user |

### Users

All endpoints below require `SUPER_ADMIN` except `GET /users/me`.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/users` | Create user; hashes password with bcrypt cost 12 |
| GET | `/users` | Paginated list; `?page=&limit=&search=` (max limit: 500) |
| GET | `/users/me` | Returns the currently logged-in user (no role check) |
| GET | `/users/:id` | Single user with role assignments |
| PUT | `/users/:id` | Update user fields |
| DELETE | `/users/:id` | Soft delete |

**Pagination response shape:**
```json
{
  "data": [...],
  "total": 17,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### Roles

Read endpoints are open to any authenticated user. Write endpoints require `SUPER_ADMIN`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/roles` | List all roles ordered by name |
| GET | `/roles/:id` | Single role |
| POST | `/roles` | Create a custom role |
| PUT | `/roles/:id` | Update role; system roles cannot have their code changed |
| DELETE | `/roles/:id` | Soft delete; system roles cannot be deleted |

### User-Role Assignment

All endpoints require `SUPER_ADMIN`.

| Method | Path | Body / Notes |
|--------|------|--------------|
| POST | `/user-roles` | `{ userId, roleId }` — assign a role to a user |
| GET | `/user-roles/user/:id` | Get all role assignments for a user (includes role details) |
| DELETE | `/user-roles/:id` | Revoke a role assignment |

---

## Database schema

Three tables — no joins to legal entities, groups, or other org-hierarchy tables.

```
users
├── id (uuid, PK)
├── email (citext, unique)
├── password_hash (varchar, hidden from SELECT by default)
├── full_name (varchar)
├── employee_code (varchar, unique, nullable)
├── is_active (boolean)
├── is_platform_admin (boolean)   ← grants implicit SUPER_ADMIN
├── last_login_at (timestamptz)
└── created_at / updated_at / deleted_at / created_by / updated_by

roles
├── id (uuid, PK)
├── code (varchar, unique)        ← e.g. SUPER_ADMIN, INITIATOR
├── name (varchar)
├── description (text)
├── is_system (boolean)           ← system roles cannot be deleted
└── created_at / updated_at / deleted_at

user_roles
├── id (uuid, PK)
├── user_id (FK → users, CASCADE)
├── role_id (FK → roles, RESTRICT)
└── created_at
```

---

## Seeded users (Radiant authority matrix)

Default password for all seeded users: **`Radiant@1234`**

| Full name | Email | Role(s) |
|-----------|-------|---------|
| System Administrator | admin@radiant.com | SUPER_ADMIN |
| *(17 users total from authority matrix)* | — | INITIATOR / CHECKER / APPROVER_1 / APPROVER_2 |

Exact users and assignments are seeded from the **Approval system - Radiant.xlsx** and
**Payments Authority Matrix** documents.

---

## Role reference

| Code | Description |
|------|-------------|
| `SUPER_ADMIN` | Full platform access — user/role management |
| `INITIATOR` | Submits payment requests |
| `CHECKER` | Verifies payment requests (maker-checker step) |
| `APPROVER_1` | First-level approver |
| `APPROVER_2` | Second-level approver |

> `is_platform_admin = true` on a user grants implicit `SUPER_ADMIN` regardless of
> `user_roles` assignments. This is the bootstrap escape-hatch — assign the role properly
> and consider setting this flag to `false` afterwards.

---

## Folder structure

```
payments-control-system/
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── main.ts                 App bootstrap (Helmet, CORS, ValidationPipe, Swagger)
│       ├── app.module.ts           Registers Auth, Users, Roles, UserRoles
│       ├── config/
│       │   ├── app.config.ts
│       │   ├── database.config.ts  TypeORM PostgreSQL (synchronize: false)
│       │   └── jwt.config.ts
│       ├── common/
│       │   ├── decorators/
│       │   │   ├── current-user.decorator.ts
│       │   │   ├── public.decorator.ts
│       │   │   └── roles.decorator.ts
│       │   ├── dto/
│       │   │   └── pagination.dto.ts   (max limit: 500)
│       │   ├── entities/
│       │   │   └── base.entity.ts      (id, createdAt, updatedAt, deletedAt, createdBy, updatedBy)
│       │   ├── enums/
│       │   │   └── role.enum.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   └── guards/
│       │       ├── jwt-auth.guard.ts
│       │       └── roles.guard.ts
│       └── modules/
│           ├── auth/               POST /auth/login, GET /auth/me
│           ├── users/              CRUD /users, GET /users/me
│           │   ├── user.entity.ts
│           │   ├── user-role.entity.ts
│           │   ├── users.service.ts
│           │   ├── users.controller.ts
│           │   └── dto/
│           ├── roles/              CRUD /roles
│           │   ├── role.entity.ts
│           │   ├── roles.service.ts
│           │   ├── roles.controller.ts
│           │   └── dto/
│           └── user-roles/         POST/GET/DELETE /user-roles
│               ├── user-roles.service.ts
│               ├── user-roles.controller.ts
│               └── dto/
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app/
        │   ├── login/              Public login page
        │   └── (protected)/
        │       ├── layout.tsx      AppShell (sidebar + auth guard)
        │       ├── users/          User list with search and CRUD dialogs
        │       └── user-roles/     Role assignment — select user, assign/revoke roles
        ├── components/
        │   ├── ui/                 Shadcn UI components (Button, Dialog, Table, Select …)
        │   ├── layout/
        │   │   ├── app-shell.tsx   Root shell with role-based access check
        │   │   ├── sidebar.tsx     2-item nav: Users + Roles
        │   │   └── breadcrumbs.tsx
        │   └── shared/
        │       ├── page-header.tsx
        │       └── confirm-delete.tsx
        ├── hooks/
        │   ├── use-auth.tsx        Auth state: login, logout, current user
        │   └── use-notify.ts       Centralised toast: notify.success / .error / .info
        ├── lib/
        │   ├── api.ts              Fetch wrapper + friendlyError() translator
        │   ├── roles.ts            hasAnyRole() utility
        │   └── route-permissions.ts  requiredRolesFor(pathname)
        └── types/
            └── domain.ts           TypeScript interfaces for all domain models
```

---

## Security notes

- **JWT HS256** bearer tokens; switch to RS256 for production.
- `SUPER_ADMIN` required for all write operations via `@Roles` + `RolesGuard`.
- `is_platform_admin` is a bootstrap escape-hatch — revoke after initial setup.
- Soft deletes via `deleted_at`; TypeORM adds `WHERE deleted_at IS NULL` automatically.
- Passwords hashed with **bcrypt cost 12**; `password_hash` column uses `select: false`.
- `class-validator` whitelist rejects unknown payload fields.
- `helmet` security headers, configurable CORS allowlist.
- Database constraint violations (unique, FK) are mapped to HTTP 409 — never expose raw DB errors.
- Duplicate role assignments are rejected at service level before hitting the DB unique constraint.

---

## Setup checklist

- [ ] PostgreSQL running (version 14+)
- [ ] `createdb pcs` (or update `DB_NAME`)
- [ ] Run the three `CREATE TABLE` statements above
- [ ] Seed roles and admin user
- [ ] `cd backend && cp .env.example .env` — fill in `DB_*`, `JWT_SECRET`
- [ ] `npm install && npm run start:dev` in `backend/`
- [ ] `cd frontend && cp .env.example .env.local` — set `NEXT_PUBLIC_API_URL`
- [ ] `npm install && npm run dev` in `frontend/`
- [ ] Sign in at `http://localhost:3000`
- [ ] Assign `SUPER_ADMIN` role to the admin user via Role Assignment page
