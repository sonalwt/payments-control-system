'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEmployeeToken, setEmployeeToken } from '@/lib/employee-api';

/**
 * Wraps the authenticated employee pages: redirects to the employee login if
 * there is no employee token, and renders a minimal header with sign-out.
 * Deliberately independent of the staff AppShell / AuthProvider.
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
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/employee" className="font-semibold">
            My Reimbursements
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
