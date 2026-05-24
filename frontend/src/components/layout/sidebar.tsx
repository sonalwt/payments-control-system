'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Layers },
  { href: '/legal-entities', label: 'Legal Entities', icon: Building2 },
  { href: '/countries', label: 'Countries', icon: Globe },
  { href: '/business-units', label: 'Business Units', icon: Briefcase },
  { href: '/departments', label: 'Departments', icon: Network },
  { href: '/users', label: 'Users', icon: Users2 },
  { href: '/user-roles', label: 'User Role Assignment', icon: ShieldCheck },
];

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
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
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
