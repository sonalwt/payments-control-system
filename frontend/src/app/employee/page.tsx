'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeShell } from '@/components/employee/employee-shell';
import { Button } from '@/components/ui/button';
import { useNotify } from '@/hooks/use-notify';
import {
  employeeApi,
  type EmployeePaymentRequest,
  type Paginated,
} from '@/lib/employee-api';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-foreground',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-foreground';
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

export default function EmployeeRequestsPage(): React.ReactElement {
  return (
    <EmployeeShell>
      <RequestsList />
    </EmployeeShell>
  );
}

function RequestsList(): React.ReactElement {
  const notify = useNotify();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', 'payment-requests'],
    queryFn: () => employeeApi.get<Paginated<EmployeePaymentRequest>>('/employee/payment-requests'),
  });

  const submit = useMutation({
    mutationFn: (id: string) => employeeApi.post(`/employee/payment-requests/${id}/submit`),
    onSuccess: () => {
      notify.success('Submitted for approval');
      void qc.invalidateQueries({ queryKey: ['employee', 'payment-requests'] });
    },
    onError: (err) => notify.error('Could not submit', err),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) =>
      employeeApi.post(`/employee/payment-requests/${id}/withdraw`, { reason: 'Withdrawn by employee' }),
    onSuccess: () => {
      notify.success('Request withdrawn');
      void qc.invalidateQueries({ queryKey: ['employee', 'payment-requests'] });
    },
    onError: (err) => notify.error('Could not withdraw', err),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My reimbursement requests</h1>
        <Button asChild size="sm">
          <Link href="/employee/new">New request</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          You haven’t raised any reimbursement requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Request</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{r.requestNumber}</td>
                  <td className="px-4 py-2">{r.paymentType?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {r.currency?.code ?? ''} {r.amount}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        disabled={submit.isPending}
                        onClick={() => submit.mutate(r.id)}
                      >
                        Submit
                      </Button>
                    )}
                    {(r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={withdraw.isPending}
                        onClick={() => withdraw.mutate(r.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
