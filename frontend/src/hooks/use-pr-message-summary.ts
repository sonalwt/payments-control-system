import { useQuery } from '@tanstack/react-query';
import { getPrMessageSummary, getPrMessagesReadAt } from '@/lib/api';

export interface PrMessageInfo {
  /** Total number of messages in this PR's group chat. */
  count: number;
  /** True when there are messages the user hasn't viewed yet. */
  isNew: boolean;
}

/**
 * Fetches the message summary for all payment requests the current user
 * participates in, and returns a lookup function.
 *
 * Usage:
 *   const getMsgInfo = usePrMessageSummary();
 *   const info = getMsgInfo(pr.id); // PrMessageInfo | null
 */
export function usePrMessageSummary(): (prId: string) => PrMessageInfo | null {
  const { data } = useQuery({
    queryKey: ['pr-message-summary'],
    queryFn: getPrMessageSummary,
    // Refresh every 30 s so badges stay current while the user is on the page.
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return (prId: string): PrMessageInfo | null => {
    const entry = data?.find((s) => s.paymentRequestId === prId);
    if (!entry || entry.messageCount === 0) return null;

    const readAt = getPrMessagesReadAt(prId);
    const isNew =
      !readAt ||
      (!!entry.latestAt && new Date(entry.latestAt) > new Date(readAt));

    return { count: entry.messageCount, isNew };
  };
}
