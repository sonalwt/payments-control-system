/**
 * Centralised route → role mapping.
 *
 * The `AppShell` consults this map on every navigation. If the user does not
 * hold one of the listed roles, the page is replaced with a "no permission"
 * panel. Routes not listed here are open to any authenticated user.
 *
 * Keep aligned with backend @Roles() decorators in:
 *   backend/src/modules/<area>/<area>.controller.ts
 */
import { RoleCode } from './roles';

interface RouteRule {
  /** Path prefix (matched with `startsWith(prefix)` or exact equality). */
  prefix: string;
  /** Roles allowed to access pages under this prefix. */
  roles: readonly RoleCode[];
}

// Roles allowed to read shared master data (counterparties, employees on
// payment forms, beneficiaries, etc.). SUPER_ADMIN plus the four payment
// workflow roles.
const OPERATIONAL_READ: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.INITIATOR,
  RoleCode.CHECKER,
  RoleCode.APPROVER_1,
  RoleCode.APPROVER_2,
];

/**
 * Order matters — longer / more-specific prefixes must come BEFORE their
 * parents so they win the prefix match.
 */
const RULES: RouteRule[] = [
  // Organisation hierarchy & identity admin — SUPER_ADMIN only
  { prefix: '/groups', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/legal-entities', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/countries', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/business-units', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/departments', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/users', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/user-roles', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/employees', roles: [RoleCode.SUPER_ADMIN] },

  // Lookup masters — read access for everyone in the payment flow
  { prefix: '/payment-types', roles: OPERATIONAL_READ },
  { prefix: '/counterparties', roles: OPERATIONAL_READ },
  { prefix: '/approval-matrices', roles: OPERATIONAL_READ },
  { prefix: '/sanctioned-countries', roles: OPERATIONAL_READ },

  // Currencies / banking masters — SUPER_ADMIN only
  { prefix: '/currencies', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/fx-rates', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/banks', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/bank-accounts', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/account-types', roles: [RoleCode.SUPER_ADMIN] },

  // Counterparty banks & bank accounts — SUPER_ADMIN + COUNTERPARTY
  { prefix: '/counterparty/banks', roles: [RoleCode.SUPER_ADMIN, RoleCode.COUNTERPARTY] },
  { prefix: '/counterparty/bank-accounts', roles: [RoleCode.SUPER_ADMIN, RoleCode.COUNTERPARTY] },

  // Payment & receipt workflows
  { prefix: '/payment-requests', roles: OPERATIONAL_READ },
  { prefix: '/incoming-receipts', roles: OPERATIONAL_READ },

  // HR-led workflows — SUPER_ADMIN only (no HR roles in the current taxonomy)
  { prefix: '/payroll-batches', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/employee-bank-account-changes', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/reimbursements', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/fnf-settlements', roles: [RoleCode.SUPER_ADMIN] },

  // Beneficiary master
  { prefix: '/beneficiary-accounts', roles: OPERATIONAL_READ },

  // Statement upload & reconciliation
  { prefix: '/statement-uploads', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/reconciliation-exceptions', roles: [RoleCode.SUPER_ADMIN] },
  { prefix: '/exception-reports', roles: [RoleCode.SUPER_ADMIN] },
];

/**
 * Returns the role list required for `pathname`, or null if the route is open
 * to any authenticated user (dashboard, login, etc.).
 */
export function requiredRolesFor(pathname: string | null): readonly RoleCode[] | null {
  if (!pathname) return null;
  // Sort by prefix length descending to ensure longest match wins.
  const ordered = [...RULES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of ordered) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.roles;
    }
  }
  return null;
}
