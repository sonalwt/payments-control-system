'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePlus2, LogOut, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: '/employee', label: 'My Reimbursements', icon: Receipt },
  { href: '/employee/new', label: 'New Request', icon: FilePlus2 },
];

function isActive(pathname: string | null, href: string): boolean {
  if (href === '/employee') return pathname === '/employee';
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

/** Employee-portal sidebar — mirrors the staff Sidebar styling so the two
 *  portals share the same look, but with employee-only navigation. */
export function EmployeeSidebar({ onSignOut }: { onSignOut: () => void }): React.ReactElement {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">PAYMENTS</p>
        <p className="text-lg font-bold">Employee Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
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
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
