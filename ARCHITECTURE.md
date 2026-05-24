# Payments Control System — Section 1.1
## Entities and Organisational Structure

### 1. Architecture Overview

A clean, layered enterprise architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 App Router + Shadcn UI + Tailwind)    │
│   - Server components for data fetching                      │
│   - Client components for forms & interactivity              │
│   - JWT stored in httpOnly cookie                            │
└─────────────────────────────────────────────────────────────┘
                          │ REST (JSON, Bearer JWT)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (NestJS 10)                                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Controllers  │→ │  Services    │→ │  Repositories    │  │
│  │ (HTTP layer) │  │ (Business)   │  │  (TypeORM)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Cross-cutting: JwtAuthGuard, RolesGuard,             │   │
│  │  AuditInterceptor, HttpExceptionFilter, DTO          │   │
│  │  validation (class-validator), Pino logger           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL 15  (UUIDv4 PKs, soft-delete, FK integrity)     │
└─────────────────────────────────────────────────────────────┘
```

#### Domain Hierarchy

```
Group (1)
 └─ Legal Entity (N)         ← country, base_currency, approval_matrix_id
      └─ Country (N)         ← legal entity's operating countries
           └─ Business Unit (N)
                └─ Department (N)
```

#### Cross-Cutting Concerns

- **AuthN**: JWT (RS256) issued at `/auth/login`, validated by `JwtAuthGuard`.
- **AuthZ**: `@Roles()` decorator + `RolesGuard`. `SUPER_ADMIN` is the only role permitted to mutate the org hierarchy.
- **Auditing**: `AuditInterceptor` writes a row to `audit_logs` on every successful state-changing call (POST/PUT/PATCH/DELETE).
- **Soft delete**: Every domain table carries `deleted_at`; TypeORM `@DeleteDateColumn` filters it transparently.
- **Validation**: All inbound payloads pass through `class-validator` DTOs with a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.

#### Folder Layout

```
payments-control-system/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/                   # typed env config
│   │   ├── common/                   # base entity, guards, decorators, filters
│   │   ├── database/                 # data source + migrations + seeders
│   │   └── modules/                  # one folder per bounded context
│   │       ├── auth/
│   │       ├── groups/
│   │       ├── legal-entities/
│   │       ├── countries/
│   │       ├── business-units/
│   │       ├── departments/
│   │       ├── users/
│   │       ├── roles/
│   │       ├── user-entity-roles/
│   │       └── audit-logs/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/                      # App Router pages
    │   ├── components/{ui,layout,shared,forms}
    │   ├── lib/                      # api client, auth, utils
    │   ├── hooks/
    │   └── types/
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.js
```
