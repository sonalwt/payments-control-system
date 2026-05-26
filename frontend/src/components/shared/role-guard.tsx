'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { hasAnyRole, type RoleCode } from '@/lib/roles';

/**
 * Wraps a page (or part of a page) so only users holding one of the
 * `allowedRoles` see it. Falls back to a "no permission" panel otherwise,
 * matching the backend 403 the user would receive on hitting the API.
 *
 * Use at the top of a page component:
 *   <RoleGuard allowedRoles={MASTER_DATA_WRITE_ROLES}>{...}</RoleGuard>
 */
export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly RoleCode[];
  children: React.ReactNode;
}): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!hasAnyRole(user?.roles, allowedRoles)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-base font-semibold">You do not have access to this page</h2>
        <p className="text-sm text-muted-foreground">
          This screen is restricted by your role. Contact your administrator if you
          believe you should have access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
