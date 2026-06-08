'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { EmployeeShell } from '@/components/employee/employee-shell';
import { employeeApi } from '@/lib/employee-api';
import type { PaymentRequest } from '@/types/domain';
import { PaymentRequestDetailView } from '@/components/payment-requests/payment-request-detail-view';

export default function EmployeeRequestDetailPage(): React.ReactElement {
  return (
    <EmployeeShell>
      <RequestDetail />
    </EmployeeShell>
  );
}

function RequestDetail(): React.ReactElement {
  const params = useParams();
  const id = params?.id as string;

  const { data: pr, isLoading } = useQuery({
    queryKey: ['employee', 'payment-request', id],
    // The employee detail endpoint returns the same rich object as the admin
    // (findOneForEmployee -> loadOne), so we render the exact same view.
    queryFn: () => employeeApi.get<PaymentRequest>(`/employee/payment-requests/${id}`),
    enabled: !!id,
  });

  if (isLoading || !pr) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
        Loading request…
      </div>
    );
  }

  // Read-only: no action/document slots → identical UI, view only.
  return <PaymentRequestDetailView pr={pr} backHref="/employee" />;
}
