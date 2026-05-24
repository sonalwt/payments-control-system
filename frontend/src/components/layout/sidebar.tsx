'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
}

const DASHBOARD: NavItem = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

const GROUPS: NavGroup[] = [
  {
    label: 'User Setting',
    icon: Settings,
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
    items: [
      { href: '/payment-types', label: 'Payment Types', icon: Wallet },
      { href: '/counterparties', label: 'Counterparties', icon: Contact2 },
      { href: '/employees', label: 'Employees', icon: UserSquare2 },
      { href: '/approval-matrices', label: 'Approval Matrices', icon: ListTree },
      { href: '/sanctioned-countries', label: 'Sanctioned Countries', icon: Ban },
    ],
  },
  {
    label: 'Banking',
    icon: Banknote,
    items: [
      { href: '/currencies', label: 'Currencies', icon: Coins },
      { href: '/fx-rates', label: 'FX Rates', icon: TrendingUp },
      { href: '/banks', label: 'Banks', icon: Landmark },
      { href: '/bank-accounts', label: 'Bank Accounts', icon: CreditCard },
    ],
  },
];

function isItemActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">PAYMENTS</p>
        <p className="text-lg font-bold">Control System</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <NavLink item={DASHBOARD} active={isItemActive(pathname, DASHBOARD.href)} />
        {GROUPS.map((group) => (
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
