'use client';

import { AppShell } from '@/components/layout/app-shell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AppShell>{children}</AppShell>;
}
