'use client';

import { useToast } from '@/components/ui/toast';
import { friendlyError } from '@/lib/api';

/**
 * Central notification helper. Use this instead of calling `useToast()` directly.
 *
 * Usage:
 *   const notify = useNotify();
 *
 *   notify.success('Payment request created');
 *   notify.success('Record updated', 'All changes have been saved.');
 *
 *   notify.error('Save failed', err);          // err → auto-translated via friendlyError()
 *   notify.error('Not allowed', 'Custom msg'); // plain string description also accepted
 *
 *   notify.info('Processing', 'Your request is being reviewed.');
 */
export function useNotify() {
  const { toast } = useToast();

  return {
    /**
     * Show a green success notification.
     * @param title   Short action-result label, e.g. "Payment request created"
     * @param description Optional additional detail
     */
    success(title: string, description?: string) {
      toast({ title, description, variant: 'success' });
    },

    /**
     * Show a red error notification.
     * @param title   Short label, e.g. "Save failed"
     * @param err     Either an Error/ApiError (auto-translated to a friendly message)
     *                or a plain string (used as-is).
     *                Omit to show title only.
     */
    error(title: string, err?: unknown) {
      let description: string | undefined;
      if (err !== undefined) {
        description = typeof err === 'string' ? err : friendlyError(err);
      }
      toast({ title, description, variant: 'error' });
    },

    /**
     * Show a blue informational notification.
     * @param title       Short label
     * @param description Optional additional detail
     */
    info(title: string, description?: string) {
      toast({ title, description, variant: 'default' });
    },
  };
}
