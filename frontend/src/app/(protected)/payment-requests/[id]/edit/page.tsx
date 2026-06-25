'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { PaymentRequest } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';
import { useAuth } from '@/hooks/use-auth';
import { PaymentRequestForm, type PaymentRequestFormData } from '../../payment-request-form';
import { RejectionHistory } from '@/components/payment-requests/rejection-history';

export default function EditPaymentRequestPage(): React.ReactElement {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();
  const { user } = useAuth();

  const { data: pr, isLoading } = useQuery({
    queryKey: ['payment-request', id],
    queryFn: () => api.get<PaymentRequest>(`/payment-requests/${id}`),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (d: PaymentRequestFormData) => api.put<PaymentRequest>(`/payment-requests/${id}`, {
      paymentTypeId: d.paymentTypeId,
      counterpartyId: d.counterpartyId || undefined,
      beneficiaryAccountId: d.beneficiaryAccountId || undefined,
      legalEntityId: d.legalEntityId || undefined,
      sourceAccountId: d.sourceAccountId || undefined,
      currencyId: d.currencyId,
      amount: d.amount,
      purposeDescription: d.purposeDescription || undefined,
      invoiceNumber: d.invoiceNumber || undefined,
      dueDate: d.dueDate || undefined,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payment-request', id] });
      void qc.invalidateQueries({ queryKey: ['payment-requests'] });
      notify.success('Draft updated');
      router.push(`/payment-requests/${id}`);
    },
    onError: (e: Error) => notify.error('Update failed', e),
  });

  const defaultValues = useMemo<Partial<PaymentRequestFormData> | undefined>(() => {
    if (!pr) return undefined;
    return {
      paymentTypeId: pr.paymentTypeId,
      counterpartyId: pr.counterpartyId ?? '',
      beneficiaryAccountId: pr.beneficiaryAccountId ?? '',
      legalEntityId: pr.legalEntityId ?? '',
      sourceAccountId: pr.sourceAccountId ?? '',
      currencyId: pr.currencyId,
      amount: String(pr.amount),
      purposeDescription: pr.purposeDescription ?? '',
      invoiceNumber: pr.invoiceNumber ?? '',
      dueDate: pr.dueDate ?? '',
    };
  }, [pr]);

  if (isLoading || !pr) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
        Loading payment request…
      </div>
    );
  }

  const backToDetail = (
    <Link href={`/payment-requests/${id}`}>
      <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to detail</Button>
    </Link>
  );

  // Only the creator may edit, and only while the request is a DRAFT.
  const isMine = pr.createdBy === user?.id;
  if (pr.status !== 'DRAFT' || !isMine) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={`Edit ${pr.requestNumber}`}
          description="Edit unavailable for this request."
          actions={backToDetail}
        />
        <Card className="p-6 text-sm">
          {pr.status !== 'DRAFT' ? (
            <p>
              This request is currently in <strong>{pr.status.replace(/_/g, ' ')}</strong> status.
              Only requests in <strong>DRAFT</strong> status can be edited.
            </p>
          ) : (
            <p>Only the creator of a draft payment request can edit it.</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Edit ${pr.requestNumber}`}
        description="Update this draft, then save. Documents are managed from the detail page."
        actions={backToDetail}
      />
      {/* Show why prior attempts were rejected (and their details) while editing
          a reopened request. */}
      <RejectionHistory rejections={pr.rejections} />
      <Card className="p-6">
        <PaymentRequestForm
          defaultValues={defaultValues}
          showDocuments={false}
          submitLabel="Save changes"
          submitting={updateMut.isPending}
          onSubmit={(d) => updateMut.mutate(d)}
        />
      </Card>
    </div>
  );
}
