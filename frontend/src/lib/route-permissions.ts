/**
 * Centralised route → role mapping for Sections 1–8 protected pages.
 *
 * The `AppShell` consults this map on every navigation. If the user does not
 * hold one of the listed roles, the page is replaced with a "no permission"
 * panel. Routes not listed here are open to any authenticated user.
 *
 * Keep aligned with backend @Roles() decorators in:
 *   backend/src/modules/<area>/<area>.controller.ts
 */
import {
  ADMIN_ROLES,
  BANKING_ROLES,
  BENEFICIARY_VIEW_ROLES,
  HR_WORKFLOW_ROLES,
  MASTER_DATA_READ_ROLES,
  PAYMENT_REQUEST_VIEW_ROLES,
  RECONCILIATION_VIEW_ROLES,
  type RoleCode,
} from './roles';

interface RouteRule {
  /** Path prefix (matched with `startsWith(prefix)` or exact equality). */
  prefix: string;
  /** Roles allowed to access pages under this prefix. */
  roles: readonly RoleCode[];
}

/**
 * Order matters — longer / more-specific prefixes must come BEFORE their
 * parents so they win the prefix match.
 */
const RULES: RouteRule[] = [
  // §1.1 — Organisation hierarchy (admin only)
  { prefix: '/groups', roles: ADMIN_ROLES },
  { prefix: '/legal-entities', roles: ADMIN_ROLES },
  { prefix: '/countries', roles: ADMIN_ROLES },
  { prefix: '/business-units', roles: ADMIN_ROLES },
  { prefix: '/departments', roles: ADMIN_ROLES },
  { prefix: '/users', roles: ADMIN_ROLES },
  { prefix: '/user-roles', roles: ADMIN_ROLES },

  // §1.2 — §1.6 — Master data lookups (broad read access; backend gates writes)
  { prefix: '/payment-types', roles: MASTER_DATA_READ_ROLES },
  { prefix: '/counterparties', roles: MASTER_DATA_READ_ROLES },
  { prefix: '/employees', roles: MASTER_DATA_READ_ROLES },
  { prefix: '/approval-matrices', roles: MASTER_DATA_READ_ROLES },
  { prefix: '/sanctioned-countries', roles: MASTER_DATA_READ_ROLES },

  // §2 — Currency, FX, banks, accounts
  { prefix: '/currencies', roles: BANKING_ROLES },
  { prefix: '/fx-rates', roles: BANKING_ROLES },
  { prefix: '/banks', roles: BANKING_ROLES },
  { prefix: '/bank-accounts', roles: BANKING_ROLES },

  // §3, §4, §7 — payment & receipt workflows
  { prefix: '/payment-requests', roles: PAYMENT_REQUEST_VIEW_ROLES },
  { prefix: '/incoming-receipts', roles: PAYMENT_REQUEST_VIEW_ROLES },

  // §5 — HR-led workflows
  { prefix: '/payroll-batches', roles: HR_WORKFLOW_ROLES },
  { prefix: '/employee-bank-account-changes', roles: HR_WORKFLOW_ROLES },
  { prefix: '/reimbursements', roles: HR_WORKFLOW_ROLES },
  { prefix: '/fnf-settlements', roles: HR_WORKFLOW_ROLES },

  // §6 — Beneficiary master
  { prefix: '/beneficiary-accounts', roles: BENEFICIARY_VIEW_ROLES },

  // §8 — Statement upload & reconciliation
  { prefix: '/statement-uploads', roles: RECONCILIATION_VIEW_ROLES },
  { prefix: '/reconciliation-exceptions', roles: RECONCILIATION_VIEW_ROLES },
  { prefix: '/exception-reports', roles: RECONCILIATION_VIEW_ROLES },
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
