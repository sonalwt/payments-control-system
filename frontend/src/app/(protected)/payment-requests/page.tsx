'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Eye, Plus, Search, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  Paginated,
  PaymentRequest,
  PaymentRequestStatus,
  PaymentType,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PaymentRequestForm, type PaymentRequestFormData } from './payment-request-form';
import { useAuth } from '@/hooks/use-auth';

const KEY = 'payment-requests';

const STATUS_STYLES: Record<PaymentRequestStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground ring-border',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 ring-blue-200',
  AWAITING_PAYMENT_CONFIRMATION: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-muted text-muted-foreground ring-border',
  CANCELLED: 'bg-muted text-muted-foreground ring-border',
};

export default function PaymentRequestsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const notify = useNotify();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: makerCheck } = useQuery({
    queryKey: ['payment-types-mine-check'],
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?mine=true&limit=1'),
    enabled: !!user,
  });
  const canCreate = !!user && (makerCheck?.total ?? 0) > 0;

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (status) u.set('status', status);
    return u.toString();
  }, [page, search, status]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PaymentRequest>>(`/payment-requests?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (d: PaymentRequestFormData) => api.post<PaymentRequest>('/payment-requests', {
      paymentTypeId: d.paymentTypeId,
      legalEntityId: d.legalEntityId,
      counterpartyId: d.counterpartyId || undefined,
      beneficiaryAccountId: d.beneficiaryAccountId || undefined,
      sourceAccountId: d.sourceAccountId || undefined,
      currencyId: d.currencyId,
      amount: d.amount,
      purposeDescription: d.purposeDescription || undefined,
      invoiceNumber: d.invoiceNumber || undefined,
      dueDate: d.dueDate || undefined,
      documents: d.documents?.map((doc) => ({
        documentCode: doc.documentCode,
        documentLabel: doc.documentLabel,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
      })),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Draft payment request created');
    },
    onError: (e: Error) => notify.error('Create failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Payment Requests"
        description="SoW §3 / §4 — outgoing payment lifecycle. Create a draft, submit through the approval matrix, release on approval, then capture bank reference + proof of payment."
        actions={
          canCreate ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New payment request</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create payment request</DialogTitle>
                  <p className="text-xs text-muted-foreground">Saved as DRAFT. Use Submit to start the approval flow.</p>
                </DialogHeader>
                <PaymentRequestForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request number, invoice or counterparty"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="max-w-md"
          />
          <div className="ml-auto w-56">
            <Select
              options={[
                { label: 'All statuses', value: '' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Pending approval', value: 'PENDING_APPROVAL' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Awaiting payment confirmation', value: 'AWAITING_PAYMENT_CONFIRMATION' },
                { label: 'Paid', value: 'PAID' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Withdrawn', value: 'WITHDRAWN' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1">
                    {pr.requestNumber}
                    {pr.sanctionWarning && <ShieldAlert className="h-3 w-3 text-amber-600" title="Sanctioned country" />}
                    {pr.anomalyFlag && <AlertTriangle className="h-3 w-3 text-orange-500" title="Anomaly detected" />}
                  </span>
                  {pr.invoiceNumber && (
                    <div className="text-xs text-muted-foreground">{pr.invoiceNumber}</div>
                  )}
                </TableCell>
                <TableCell>{pr.paymentType?.name ?? '—'}</TableCell>
                <TableCell className="text-sm">{pr.counterparty?.legalName ?? pr.employee?.fullName ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {pr.beneficiaryAccount?.accountHolderName ?? '—'}
                  {pr.beneficiaryAccount?.accountNumber && (
                    <div className="text-xs text-muted-foreground"><code>{pr.beneficiaryAccount.accountNumber}</code></div>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pr.currency?.code ?? ''} {Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[pr.status]}`}>
                    {pr.status.replace(/_/g, ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/payment-requests/${pr.id}`}>
                    <Button size="icon" variant="ghost" title="Open"><Eye className="h-4 w-4" /></Button>
                  </Link>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No payment requests yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
