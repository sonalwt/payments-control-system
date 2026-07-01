'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationBell } from './notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { hasAnyRole } from '@/lib/roles';
import { requiredRolesFor } from '@/lib/route-permissions';

export function AppShell({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const required = requiredRolesFor(pathname);
  const permitted = required === null || hasAnyRole(user.roles, required);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumbs />
            <NotificationBell />
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          {permitted ? children : <NoAccess />}
        </div>
      </main>
    </div>
  );
}

function NoAccess(): React.ReactElement {
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" />
      <h2 className="text-base font-semibold">You do not have access to this page</h2>
      <p className="text-sm text-muted-foreground">
        This screen is restricted by your role. Contact your administrator if
        you believe you should have access.
      </p>
    </div>
  );
}
