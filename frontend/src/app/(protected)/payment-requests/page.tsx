'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type {
  BeneficiaryAccount,
  Counterparty,
  Employee,
  LegalEntity,
  Paginated,
  PaymentRequest,
  PaymentRequestStatus,
  PaymentType,
  SanctionedCountry,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { PaymentRequestForm, type PaymentRequestFormData } from './payment-request-form';

const KEY = 'payment-requests';

const ALL_STATUSES: PaymentRequestStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'AWAITING_PAYMENT_CONFIRMATION',
  'PAID',
  'REJECTED',
  'WITHDRAWN',
  'CANCELLED',
];

const STATUS_LABEL: Record<PaymentRequestStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  AWAITING_PAYMENT_CONFIRMATION: 'Awaiting Payment',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<PaymentRequestStatus, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PENDING_APPROVAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  APPROVED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  AWAITING_PAYMENT_CONFIRMATION: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  PAID: 'bg-green-700/10 text-green-800 dark:text-green-300',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-400',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: PaymentRequestStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function PaymentRequestsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentRequestStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<PaymentRequest | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (statusFilter) u.set('status', statusFilter);
    if (typeFilter) u.set('paymentTypeCode', typeFilter);
    if (entityFilter) u.set('legalEntityId', entityFilter);
    return u.toString();
  }, [page, search, statusFilter, typeFilter, entityFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PaymentRequest>>(`/payment-requests?${params}`),
  });

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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Payment request created (Draft)', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Create failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/payment-requests/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      toast({ title: 'Payment request deleted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const typeOpts = paymentTypes?.data ?? [];
  const entityOpts = legalEntities?.data ?? [];
  const counterpartyOpts = counterparties?.data ?? [];
  const employeeOpts = employees?.data ?? [];
  const beneficiaryOpts = beneficiaryAccounts?.data ?? [];

  // Form can render as soon as we have at least the payment types and legal entities.
  // Counterparties / employees default to empty arrays until their queries resolve.
  const formReady = !!paymentTypes && !!legalEntities;

  return (
    <div>
      <PageHeader
        title="Payment Requests"
        description="Create and track outgoing payment requests through the full approval and payment lifecycle (SOW §3)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create payment request</DialogTitle>
              </DialogHeader>
              {formReady ? (
                <PaymentRequestForm
                  paymentTypes={typeOpts}
                  legalEntities={entityOpts}
                  counterparties={counterpartyOpts}
                  employees={employeeOpts}
                  beneficiaryAccounts={beneficiaryOpts}
                  sanctionedCountryCodes={sanctionedCountryCodes}
                  submitting={createMutation.isPending}
                  onSubmit={(d) => createMutation.mutate(d)}
                />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Loading form data…
                </p>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference or description"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="max-w-xs"
            />
          </div>

          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value as PaymentRequestStatus | ''); }}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={typeFilter}
            onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
          >
            <option value="">All payment types</option>
            {typeOpts.map((pt) => (
              <option key={pt.code} value={pt.code}>{pt.name}</option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={entityFilter}
            onChange={(e) => { setPage(1); setEntityFilter(e.target.value); }}
          >
            <option value="">All entities</option>
            {entityOpts.map((le) => (
              <option key={le.id} value={le.id}>{le.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {pr.requestNumber}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      {pr.paymentTypeCode}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {pr.counterparty?.name ?? pr.employee?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{pr.currencyCode}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {Number(pr.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pr.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(pr.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/payment-requests/${pr.id}`}>
                      <Button size="icon" variant="ghost" title="View / Act">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete (draft only)"
                      disabled={pr.status !== 'DRAFT'}
                      onClick={() => setDeleting(pr)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No payment requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data && (
          <DataTablePagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete request "${deleting?.requestNumber}"?`}
        description="Only DRAFT requests can be deleted. This action is irreversible."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
