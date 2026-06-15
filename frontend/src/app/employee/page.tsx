'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeShell } from '@/components/employee/employee-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
    <div>
      <PageHeader
        title="My Reimbursements"
        description="Raise reimbursement requests and track their approval status."
        actions={
          <Button asChild>
            <Link href="/employee/new"><Plus className="mr-2 h-4 w-4" /> New request</Link>
          </Button>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-56 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">You haven’t raised any reimbursement requests yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.requestNumber}</TableCell>
                <TableCell>{r.paymentType?.name ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{r.currency?.code ?? ''} {r.amount}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/employee/requests/${r.id}`}>View</Link>
                    </Button>
                    {r.status === 'DRAFT' && (
                      <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate(r.id)}>
                        Submit
                      </Button>
                    )}
                    {(r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL') && (
                      <Button size="sm" variant="ghost" disabled={withdraw.isPending} onClick={() => withdraw.mutate(r.id)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
