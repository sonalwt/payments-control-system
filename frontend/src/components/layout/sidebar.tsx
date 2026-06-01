'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck, Briefcase, Building, Building2, ChevronDown, Coins, CreditCard, Database, FileType2, FolderTree, Globe2, GitBranch, Handshake,
  Landmark, ListChecks, LogOut, ShieldCheck, Users2, Wallet2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { hasAnyRole, RoleCode } from '@/lib/roles';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: readonly RoleCode[];
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  roles?: readonly RoleCode[];
}

const TOP_LEVEL: NavItem[] = [];

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Masters',
    icon: Database,
    roles: [RoleCode.SUPER_ADMIN],
    items: [
      { href: '/currencies',     label: 'Currencies',     icon: Coins },
      { href: '/countries',      label: 'Countries',      icon: Globe2 },
      { href: '/legal-entities', label: 'Legal Entities', icon: Building2 },
      { href: '/user-roles',     label: 'Roles',          icon: ShieldCheck },
      { href: '/users',          label: 'Users',          icon: Users2 },
      { href: '/employees',      label: 'Employees',      icon: BadgeCheck },
      { href: '/banks',          label: 'Banks',          icon: Building },
      { href: '/account-types',  label: 'Account Types',  icon: ListChecks },
      { href: '/bank-accounts',  label: 'Bank Accounts',  icon: Landmark },
      { href: '/beneficiary-accounts', label: 'Beneficiary Accounts', icon: Wallet2 },
      { href: '/payment-categories', label: 'Payment Categories', icon: FolderTree },
      { href: '/payment-types',      label: 'Payment Types',      icon: FileType2 },
      { href: '/approval-matrices',  label: 'Approval Matrices',  icon: GitBranch },
    ],
  },
  {
    label: 'Counterparty',
    icon: Handshake,
    roles: [RoleCode.SUPER_ADMIN, RoleCode.COUNTERPARTY],
    items: [
      { href: '/counterparties', label: 'Counterparties', icon: Briefcase },
    ],
  },
  {
    label: 'Payments',
    icon: CreditCard,
    // Open to every authenticated user — non-admin / non-counterparty users
    // (the team-role holders: OPS_TEAM, HR, etc.) need to see this group
    // to access matrices and create payment requests they're eligible for.
    items: [
      { href: '/payment-requests',     label: 'Payment Requests',     icon: CreditCard },
    ],
  },
];

function isActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

function groupHasActive(pathname: string | null, group: NavGroup): boolean {
  return group.items.some((i) => isActive(pathname, i.href));
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleGroups = NAV_GROUPS.filter(
    (g) => !g.roles || hasAnyRole(user?.roles, g.roles),
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      visibleGroups.map((g) => [g.label, groupHasActive(pathname, g)]),
    ),
  );

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">PAYMENTS</p>
        <p className="text-lg font-bold">Control System</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {TOP_LEVEL.filter((i) => !i.roles || hasAnyRole(user?.roles, i.roles)).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const open = openGroups[group.label] ?? false;
          const hasActive = groupHasActive(pathname, group);
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  hasActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                aria-expanded={open}
              >
                <GroupIcon className="h-4 w-4" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
                />
              </button>
              {open && (
                <div className="mt-1 space-y-1 border-l border-border pl-3 ml-4">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
