'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useNotify } from '@/hooks/use-notify';
import { Button } from '@/components/ui/button';

/**
 * Sidebar action: emails the signed-in user a password-reset link rather than
 * changing the password in place. Mirrors the public "forgot password" flow.
 */
export function ChangePasswordButton(): React.ReactElement {
  const { user } = useAuth();
  const notify = useNotify();
  const [sending, setSending] = useState(false);

  const onClick = async (): Promise<void> => {
    if (!user?.email) return;
    setSending(true);
    try {
      await api.post<void>('/auth/forgot-password', { email: user.email });
      notify.success('Reset link sent', `Check ${user.email} for a link to change your password.`);
    } catch (err) {
      notify.error('Could not send reset link', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground"
      onClick={onClick}
      disabled={sending}
    >
      <KeyRound className="mr-2 h-4 w-4" /> {sending ? 'Sending link…' : 'Change password'}
    </Button>
  );
}
