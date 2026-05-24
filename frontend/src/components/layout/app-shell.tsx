'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { useAuth } from '@/hooks/use-auth';

export function AppShell({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-4">
          <Breadcrumbs />
        </header>
        <div className="flex-1 overflow-auto bg-muted/30 p-6">{children}</div>
      </main>
    </div>
  );
}
