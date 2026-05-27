'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  Layers,
  Globe,
  Briefcase,
  Users2,
  Network,
  LayoutDashboard,
  LogOut,
  Wallet,
  Contact2,
  UserSquare2,
  ListTree,
  Ban,
  ChevronDown,
  ChevronRight,
  Settings,
  Database,
  Coins,
  TrendingUp,
  Landmark,
  CreditCard,
  Banknote,
  FileStack,
  BookUser,
  ClipboardList,
  UploadCloud,
  Receipt,
  HandCoins,
  UsersRound,
  Layers2,
  LockKeyhole,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  ADMIN_ROLES,
  MASTER_DATA_READ_ROLES,
  BANKING_ROLES,
  HR_WORKFLOW_ROLES,
  PAYMENT_REQUEST_VIEW_ROLES,
  RECONCILIATION_VIEW_ROLES,
  CHAIRMAN_PAYMENT_ROLES,
  CHAIRMAN_EXECUTION_ROLES,
  CHAIRMAN_BENEFICIARY_ROLES,
} from '@/lib/roles';

type Icon = React.ComponentType<{ className?: string }>;
interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** When set, item is only shown to users holding at least one of these roles. */
  allowedRoles?: readonly string[];
}
interface NavGroup {
  label: string;
  icon: Icon;
  items: NavItem[];
  /** Role codes that may see this group. Empty = everyone. */
  allowedRoles?: readonly string[];
}

const DASHBOARD: NavItem = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

// Role mappings derived from SoW §13 (Dashboards and Reporting) and §14 (User
// Roles). Keep these aligned with backend @Roles() decorators — a user must
// hold a role surfaced here AND the matching role on the API call.
const GROUPS: NavGroup[] = [
  {
    label: 'Payments',
    icon: FileStack,
    allowedRoles: PAYMENT_REQUEST_VIEW_ROLES,
    items: [
      { href: '/payment-requests', label: 'Payment Requests', icon: FileStack },
      { href: '/incoming-receipts', label: 'Incoming Receipts', icon: HandCoins },
    ],
  },
  {
    // §14 — System Administrator manages users, roles, and organisational
    // hierarchy under dual control with Super Administrator.
    label: 'User Settings',
    icon: Settings,
    allowedRoles: ADMIN_ROLES,
    items: [
      { href: '/groups', label: 'Groups', icon: Layers },
      { href: '/legal-entities', label: 'Legal Entities', icon: Building2 },
      { href: '/countries', label: 'Countries', icon: Globe },
      { href: '/business-units', label: 'Business Units', icon: Briefcase },
      { href: '/departments', label: 'Departments', icon: Network },
      { href: '/users', label: 'Users', icon: Users2 },
    ],
  },
  {
    // §1 — master data lookups visible to anyone who needs to pick a value
    // (initiators, makers, checkers, finance heads, auditors).
    label: 'Masters',
    icon: Database,
    allowedRoles: MASTER_DATA_READ_ROLES,
    items: [
      { href: '/payment-types', label: 'Payment Types', icon: Wallet },
      { href: '/counterparties', label: 'Counterparties', icon: Contact2 },
      { href: '/employees', label: 'Employees', icon: UserSquare2 },
      { href: '/beneficiary-accounts', label: 'Beneficiary Accounts', icon: BookUser },
      { href: '/approval-matrices', label: 'Approval Matrices', icon: ListTree },
      { href: '/sanctioned-countries', label: 'Sanctioned Countries', icon: Ban },
    ],
  },
  {
    // §2 — banking and account configuration. §8 — bank statement
    // reconciliation lives alongside.
    label: 'Banking',
    icon: Banknote,
    allowedRoles: BANKING_ROLES,
    items: [
      { href: '/currencies', label: 'Currencies', icon: Coins },
      { href: '/fx-rates', label: 'FX Rates', icon: TrendingUp },
      { href: '/banks', label: 'Banks', icon: Landmark },
      { href: '/bank-accounts', label: 'Bank Accounts', icon: CreditCard },
      { href: '/statement-uploads', label: 'Statement Uploads', icon: UploadCloud },
      { href: '/reconciliation-exceptions', label: 'Reconciliation Exceptions', icon: AlertTriangle },
    ],
  },
  {
    // §5 — HR-led payroll, reimbursement, FnF. HR Initiator + Payroll Approver.
    label: 'Payroll',
    icon: UsersRound,
    allowedRoles: HR_WORKFLOW_ROLES,
    items: [
      { href: '/payroll-batches', label: 'Payroll Batches', icon: Layers2 },
      { href: '/employee-bank-account-changes', label: 'Bank Account Changes', icon: HandCoins },
      { href: '/reimbursements/new', label: 'New Reimbursement', icon: Receipt },
      { href: '/fnf-settlements/new', label: 'New FnF Settlement', icon: HandCoins },
    ],
  },
  {
    label: 'Reports',
    icon: ClipboardList,
    allowedRoles: RECONCILIATION_VIEW_ROLES,
    items: [
      { href: '/exception-reports', label: 'Exception Reports', icon: ClipboardList },
    ],
  },
  {
    // §9 — Chairman payments: confidential, chain-free. CHAIRMAN initiates;
    // Maker / Checker / Head handle execution. Beneficiary list is hidden from
    // non-execution roles.
    label: 'Chairman Payments',
    icon: LockKeyhole,
    allowedRoles: CHAIRMAN_PAYMENT_ROLES,
    items: [
      {
        href: '/chairman-payments',
        label: 'Payment Queue',
        icon: FileStack,
        allowedRoles: CHAIRMAN_EXECUTION_ROLES,
      },
      {
        href: '/chairman-beneficiaries',
        label: 'Beneficiaries',
        icon: BookUser,
        allowedRoles: CHAIRMAN_EXECUTION_ROLES,
      },
      {
        href: '/chairman-beneficiaries/change-requests',
        label: 'Beneficiary Changes',
        icon: ClipboardList,
        allowedRoles: CHAIRMAN_BENEFICIARY_ROLES,
      },
    ],
  },
];
function isItemActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRoles: string[] = user?.roles ?? [];

  // A group is visible if it has no role restriction OR the user holds at least one allowed role.
  const visibleGroups = GROUPS.filter(
    (g) => !g.allowedRoles || g.allowedRoles.some((r) => userRoles.includes(r)),
  );

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">PAYMENTS</p>
        <p className="text-lg font-bold">Control System</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <NavLink item={DASHBOARD} active={isItemActive(pathname, DASHBOARD.href)} />
        {visibleGroups.map((group) => (
          <NavGroupSection key={group.label} group={group} pathname={pathname} userRoles={userRoles} />
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 px-2 text-xs">
          <p className="font-medium">{user?.fullName ?? 'Anonymous'}</p>
          <p className="truncate text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}

function NavGroupSection({
  group,
  pathname,
  userRoles,
}: {
  group: NavGroup;
  pathname: string | null;
  userRoles: string[];
}): React.ReactElement {
  // Filter items by per-item allowedRoles if present.
  const visibleItems = group.items.filter(
    (it) => !it.allowedRoles || it.allowedRoles.some((r) => userRoles.includes(r)),
  );

  const hasActiveChild = visibleItems.some((it) => isItemActive(pathname, it.href));
  const [open, setOpen] = useState<boolean>(hasActiveChild);
  const expanded = open || hasActiveChild;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const GroupIcon = group.icon;

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide',
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
        aria-expanded={expanded}
      >
        <GroupIcon className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{group.label}</span>
        <Chevron className="h-3.5 w-3.5" />
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isItemActive(pathname, item.href)}
              indented
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({
  item,
  active,
  indented = false,
}: {
  item: NavItem;
  active: boolean;
  indented?: boolean;
}): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        indented && 'ml-2',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
