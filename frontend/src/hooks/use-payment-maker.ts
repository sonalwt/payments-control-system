import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { Paginated, PaymentType } from '@/types/domain';

/** Shared cache key so the sidebar, shell and list page issue one request. */
export const PAYMENT_MAKER_QUERY_KEY = ['payment-types-mine-check'] as const;

/**
 * True when the current user may initiate payment requests.
 *
 * There is no single "initiator" role — initiators are ordinary team-role
 * holders (ops, HR, …) who are configured as the Maker on a payment type.
 * Eligibility is therefore data-driven: `GET /payment-types?mine=true`
 * returns the payment types where the user holds the maker role, so a
 * non-empty result means the user can raise a request.
 */
export function useIsPaymentMaker(): boolean {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: PAYMENT_MAKER_QUERY_KEY,
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?mine=true&limit=1'),
    enabled: !!user,
  });

  return !!user && (data?.total ?? 0) > 0;
}
