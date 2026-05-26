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
  ShieldCheck,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

type Icon = React.ComponentType<{ className?: string }>;
interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}
interface NavGroup {
  label: string;
  icon: Icon;
  items: NavItem[];
  /** Role codes that may see this group. Empty = everyone. */
  allowedRoles?: string[];
}

const DASHBOARD: NavItem = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

const GROUPS: NavGroup[] = [
  {
    label: 'Payments',
    icon: FileStack,
    // All authenticated users can see Payment Requests and Incoming Receipts.
    items: [
      { href: '/payment-requests', label: 'Payment Requests', icon: FileStack },
      { href: '/incoming-receipts', label: 'Incoming Receipts', icon: HandCoins },
    ],
  },
  {
    label: 'User Settings',
    icon: Settings,
    // Only platform / super admins manage users, entities, and org structure.
    allowedRoles: ['SUPER_ADMIN'],
    items: [
      { href: '/groups', label: 'Groups', icon: Layers },
      { href: '/legal-entities', label: 'Legal Entities', icon: Building2 },
      { href: '/countries', label: 'Countries', icon: Globe },
      { href: '/business-units', label: 'Business Units', icon: Briefcase },
      { href: '/departments', label: 'Departments', icon: Network },
      { href: '/users', label: 'Users', icon: Users2 },
      { href: '/user-roles', label: 'User Role Assignment', icon: ShieldCheck },
    ],
  },
  {
    label: 'Masters',
    icon: Database,
    // Admins, Finance Heads, and Initiators (who register beneficiary accounts).
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_HEAD', 'INITIATOR'],
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
    label: 'Banking',
    icon: Banknote,
    // Admins, Finance Heads, and Payments Makers/Checkers who handle bank operations.
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_HEAD', 'PAYMENTS_MAKER', 'PAYMENTS_CHECKER'],
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
    label: 'Payroll',
    icon: UsersRound,
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_HEAD', 'PAYROLL_ADMIN', 'INITIATOR'],
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
    // Admins, Approvers, Finance Heads, and Payments staff.
    allowedRoles: ['SUPER_ADMIN', 'APPROVER', 'FINANCE_HEAD', 'PAYMENTS_MAKER', 'PAYMENTS_CHECKER'],
    items: [
      { href: '/exception-reports', label: 'Exception Reports', icon: ClipboardList },
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
          <NavGroupSection key={group.label} group={group} pathname={pathname} />
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
}: {
  group: NavGroup;
  pathname: string | null;
}): React.ReactElement {
  const hasActiveChild = group.items.some((it) => isItemActive(pathname, it.href));
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
          {group.items.map((item) => (
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
