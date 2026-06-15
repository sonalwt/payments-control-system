'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getEmployeeToken, setEmployeeToken } from '@/lib/employee-api';
import { EmployeeSidebar } from './employee-sidebar';

/**
 * Wraps the authenticated employee pages with the same chrome as the staff
 * AppShell — a left sidebar plus a main content area — so the employee portal
 * matches the normal portal's look. Redirects to the employee login when there
 * is no employee token. Deliberately independent of the staff AuthProvider
 * (employees are a separate auth realm).
 */
export function EmployeeShell({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!getEmployeeToken()) {
      router.replace('/employee/login');
      return;
    }
    setReady(true);
  }, [router]);

  const signOut = () => {
    setEmployeeToken(null);
    router.replace('/employee/login');
  };

  if (!ready) return null;

  return (
    <div className="flex h-screen">
      <EmployeeSidebar onSignOut={signOut} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-4">
          <h1 className="text-sm font-medium text-muted-foreground">Employee Portal</h1>
        </header>
        <div className="flex-1 overflow-auto bg-muted/30 p-6">{children}</div>
      </main>
    </div>
  );
}
