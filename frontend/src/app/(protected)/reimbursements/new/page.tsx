'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  BeneficiaryAccount,
  Counterparty,
  Employee,
  LegalEntity,
  Paginated,
  PaymentRequest,
  PaymentType,
  SanctionedCountry,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { useNotify } from '@/hooks/use-notify';
import { PaymentRequestForm, type PaymentRequestFormData } from '../../payment-requests/payment-request-form';

export default function NewReimbursementPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types-all'],
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?page=1&limit=100'),
  });
  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=100'),
  });
  const { data: counterparties } = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=100'),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => api.get<Paginated<Employee>>('/employees?page=1&limit=100'),
  });
  const { data: beneficiaryAccounts } = useQuery({
    queryKey: ['beneficiary-accounts-active'],
    queryFn: () => api.get<Paginated<BeneficiaryAccount>>('/beneficiary-accounts?status=ACTIVE&page=1&limit=100'),
  });
  const { data: sanctionedCountries } = useQuery({
    queryKey: ['sanctioned-countries-all'],
    queryFn: () => api.get<Paginated<SanctionedCountry>>('/sanctioned-countries?page=1&limit=100'),
  });

  const sanctionedCountryCodes = useMemo(
    () => new Set((sanctionedCountries?.data ?? []).filter((s) => s.isActive).map((s) => s.countryCode.toUpperCase())),
    [sanctionedCountries],
  );

  const createMutation = useMutation({
    mutationFn: (input: PaymentRequestFormData) => {
      const amountNum = parseFloat(input.amount);
      const amountMinor = Math.round(amountNum * 100);
      return api.post<PaymentRequest>('/payment-requests', {
        paymentTypeCode: input.paymentTypeCode,
        legalEntityId: input.legalEntityId,
        counterpartyId: input.counterpartyId || undefined,
        employeeId: input.employeeId || undefined,
        beneficiaryAccountId: input.beneficiaryAccountId || undefined,
        currencyCode: input.currencyCode.toUpperCase(),
        amount: input.amount,
        amountMinor,
        purposeDescription: input.purposeDescription || undefined,
        invoiceNumber: input.invoiceNumber || undefined,
        dueDate: input.dueDate || undefined,
        documents: input.documents?.length ? input.documents : undefined,
      });
    },
    onSuccess: (pr: PaymentRequest) => {
      void qc.invalidateQueries({ queryKey: ['payment-requests'] });
      notify.success('Reimbursement request created', `Draft ${pr.requestNumber} saved.`);
      router.push(`/payment-requests/${pr.id}`);
    },
    onError: (err: Error) =>
      notify.error('Create failed', err),
  });

  const isReady = !!(paymentTypes && legalEntities);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Reimbursement Request</h1>
          <p className="text-muted-foreground text-sm">Submit an expense reimbursement claim</p>
        </div>
      </div>

      {isReady && (
        <PaymentRequestForm
          paymentTypes={paymentTypes.data}
          legalEntities={legalEntities.data}
          counterparties={counterparties?.data ?? []}
          employees={employees?.data ?? []}
          beneficiaryAccounts={beneficiaryAccounts?.data ?? []}
          sanctionedCountryCodes={sanctionedCountryCodes}
          defaultValues={{ paymentTypeCode: 'REIMBURSEMENT' }}
          submitting={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}
