'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, Eye, MessageCircle, Pencil, Plus, Search, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, todayInDubai } from '@/lib/datetime';
import type {
  Paginated,
  PaymentRequest,
  PaymentRequestApproval,
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
import { usePrMessageSummary } from '@/hooks/use-pr-message-summary';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PaymentRequestForm, type PaymentRequestFormData } from './payment-request-form';
import { useAuth } from '@/hooks/use-auth';

const KEY = 'payment-requests';

type ActivityPeriod = '' | 'today' | 'month' | 'custom';

/**
 * Derive the people who have worked on a request, in chronological order:
 * the maker, then each approver who has actioned a step. PENDING steps are
 * shown separately (see `pendingAssignee`) as they haven't acted yet.
 */
interface WorkerEntry { name: string; role: string; action: string; }
function workersOf(pr: PaymentRequest): WorkerEntry[] {
  const out: WorkerEntry[] = [];
  if (pr.createdByUser) {
    out.push({ name: pr.createdByUser.fullName, role: 'Maker', action: 'Created' });
  }
  for (const a of [...(pr.approvals ?? [])].sort((x, y) => x.stepOrder - y.stepOrder)) {
    if (a.decision === 'PENDING' || !a.decidedByUser) continue;
    out.push({
      name: a.decidedByUser.fullName,
      role: a.approverType === 'ROLE' ? (a.approverRole?.name ?? 'Approver') : 'Approver',
      action: a.decision === 'APPROVED' ? 'Approved' : 'Rejected',
    });
  }
  return out;
}

/** The role/user the request is currently waiting on, if any. */
function pendingAssignee(pr: PaymentRequest): string | null {
  const step = (pr.approvals ?? []).find(
    (a: PaymentRequestApproval) => a.stepOrder === pr.currentStepOrder && a.decision === 'PENDING',
  );
  if (!step) return null;
  return step.approverType === 'ROLE'
    ? (step.approverRole?.name ?? 'a role')
    : (step.approverUser?.fullName ?? 'a user');
}

// ----- CSV export ------------------------------------------------------

const CSV_COLUMNS: { header: string; value: (pr: PaymentRequest) => string }[] = [
  { header: 'Request #', value: (pr) => pr.requestNumber },
  { header: 'Invoice #', value: (pr) => pr.invoiceNumber ?? '' },
  { header: 'Payment Type', value: (pr) => pr.paymentType?.name ?? '' },
  { header: 'Legal Entity', value: (pr) => pr.paymentType?.legalEntity?.name ?? '' },
  { header: 'Counterparty', value: (pr) => pr.counterparty?.legalName ?? pr.employee?.fullName ?? '' },
  { header: 'Beneficiary', value: (pr) => pr.beneficiaryAccount?.accountHolderName ?? '' },
  { header: 'Beneficiary Account', value: (pr) => pr.beneficiaryAccount?.accountNumber ?? '' },
  { header: 'Currency', value: (pr) => pr.currency?.code ?? '' },
  { header: 'Amount', value: (pr) => pr.amount },
  { header: 'Status', value: (pr) => pr.status.replace(/_/g, ' ') },
  { header: 'Worked On By', value: (pr) => workersOf(pr).map((w) => `${w.name} (${w.role}): ${w.action}`).join(' | ') },
  { header: 'Awaiting', value: (pr) => pendingAssignee(pr) ?? '' },
  { header: 'Created At', value: (pr) => formatDateTime(pr.createdAt, '') },
  { header: 'Submitted At', value: (pr) => formatDateTime(pr.submittedAt, '') },
  { header: 'Approved At', value: (pr) => formatDateTime(pr.approvedAt, '') },
  { header: 'Paid At', value: (pr) => formatDateTime(pr.paidAt, '') },
];

function csvCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(rows: PaymentRequest[]): string {
  const lines = [
    CSV_COLUMNS.map((c) => csvCell(c.header)).join(','),
    ...rows.map((pr) => CSV_COLUMNS.map((c) => csvCell(c.value(pr))).join(',')),
  ];
  return lines.join('\r\n');
}

function downloadCsv(csv: string, filename: string): void {
  // Prepend a BOM so Excel opens UTF-8 content correctly.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const STATUS_STYLES: Record<PaymentRequestStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground ring-border',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-amber-200',
  TREASURY_MAKER: 'bg-blue-50 text-blue-700 ring-blue-200',
  TREASURY_CHECKER: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  TREASURY_AUTHORISER: 'bg-violet-50 text-violet-700 ring-violet-200',
  TREASURY_SWIFT: 'bg-sky-50 text-sky-700 ring-sky-200',
  AWAITING_CLOSURE: 'bg-teal-50 text-teal-700 ring-teal-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-muted text-muted-foreground ring-border',
  CANCELLED: 'bg-muted text-muted-foreground ring-border',
};

export default function PaymentRequestsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [period, setPeriod] = useState<ActivityPeriod>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  // Filter-only params (no pagination) — shared by the list query and export.
  const filterParams = useMemo(() => {
    const u = new URLSearchParams();
    if (search) u.set('search', search);
    if (status) u.set('status', status);
    if (period === 'today' || period === 'month') {
      u.set('activityPeriod', period);
    } else if (period === 'custom') {
      if (dateFrom) u.set('dateFrom', dateFrom);
      if (dateTo) u.set('dateTo', dateTo);
    }
    return u;
  }, [search, status, period, dateFrom, dateTo]);

  const params = useMemo(() => {
    const u = new URLSearchParams(filterParams);
    u.set('page', String(page));
    u.set('limit', '20');
    return u.toString();
  }, [filterParams, page]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PaymentRequest>>(`/payment-requests?${params}`),
  });

  const getMsgInfo = usePrMessageSummary();

  const [exporting, setExporting] = useState(false);
  async function handleExport(): Promise<void> {
    setExporting(true);
    try {
      // Pull every row matching the current filters, not just the visible page.
      const u = new URLSearchParams(filterParams);
      u.set('page', '1');
      u.set('limit', String(Math.max(data?.total ?? 0, 1)));
      const all = await api.get<Paginated<PaymentRequest>>(`/payment-requests?${u.toString()}`);
      if (all.data.length === 0) {
        notify.error('Nothing to export', new Error('No payment requests match the current filters.'));
        return;
      }
      downloadCsv(buildCsv(all.data), `payment-requests-${todayInDubai()}.csv`);
      notify.success(`Exported ${all.data.length} payment request${all.data.length === 1 ? '' : 's'}`);
    } catch (e) {
      notify.error('Export failed', e as Error);
    } finally {
      setExporting(false);
    }
  }

  const createMut = useMutation({
    mutationFn: (d: PaymentRequestFormData) => api.post<PaymentRequest>('/payment-requests', {
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting || (data?.total ?? 0) === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            {canCreate && (
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
            )}
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request number, invoice or counterparty"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="max-w-md"
          />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                options={[
                  { label: 'All time', value: '' },
                  { label: 'Today', value: 'today' },
                  { label: 'This month', value: 'month' },
                  { label: 'Custom range…', value: 'custom' },
                ]}
                value={period}
                onChange={(e) => {
                  setPage(1);
                  setPeriod(e.target.value as ActivityPeriod);
                }}
              />
            </div>
            {period === 'custom' && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
                  className="w-40"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
                  className="w-40"
                />
              </div>
            )}
            <div className="w-56">
              <Select
                options={[
                  { label: 'All statuses', value: '' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Pending approval', value: 'PENDING_APPROVAL' },
                  { label: 'Treasury — maker', value: 'TREASURY_MAKER' },
                  { label: 'Treasury — checker', value: 'TREASURY_CHECKER' },
                  { label: 'Treasury — authoriser', value: 'TREASURY_AUTHORISER' },
                  { label: 'Treasury — SWIFT upload', value: 'TREASURY_SWIFT' },
                  { label: 'Awaiting closure', value: 'AWAITING_CLOSURE' },
                  { label: 'Completed', value: 'COMPLETED' },
                  { label: 'Rejected', value: 'REJECTED' },
                  { label: 'Withdrawn', value: 'WITHDRAWN' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ]}
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              />
            </div>
          </div>
        </div>
        <p className="px-4 pb-2 pt-3 text-xs text-muted-foreground">
          Showing payment requests you or your role(s) have worked on. The date filter matches any activity — creation, submission, approvals, release or payment.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Worked on by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1">
                    {pr.requestNumber}
                    {pr.sanctionWarning && <span title="Sanctioned country" className="inline-flex"><ShieldAlert className="h-3 w-3 text-amber-600" /></span>}
                    {pr.anomalyFlag && <span title="Anomaly detected" className="inline-flex"><AlertTriangle className="h-3 w-3 text-orange-500" /></span>}
                    {(() => {
                      const info = getMsgInfo(pr.id);
                      if (!info) return null;
                      return (
                        <span
                          title={`${info.count} chat message${info.count !== 1 ? 's' : ''}${info.isNew ? ' — new' : ''}`}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            info.isNew ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <MessageCircle className="h-2.5 w-2.5" />
                          {info.isNew ? 'NEW' : info.count}
                        </span>
                      );
                    })()}
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
                <TableCell className="text-xs">
                  {(() => {
                    const workers = workersOf(pr);
                    const pending = pendingAssignee(pr);
                    if (workers.length === 0 && !pending) return <span className="text-muted-foreground">—</span>;
                    return (
                      <div className="space-y-0.5">
                        {workers.map((w, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="font-medium">{w.name}</span>
                            <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">{w.role}</span>
                            <span className="text-muted-foreground">· {w.action}</span>
                          </div>
                        ))}
                        {pending && (
                          <div className="text-amber-700">Awaiting {pending}</div>
                        )}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[pr.status]}`}>
                    {pr.status.replace(/_/g, ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {pr.status === 'DRAFT' && pr.createdBy === user?.id && (
                    <Link href={`/payment-requests/${pr.id}/edit`}>
                      <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                  )}
                  <Link href={`/payment-requests/${pr.id}`}>
                    <Button size="icon" variant="ghost" title="Open"><Eye className="h-4 w-4" /></Button>
                  </Link>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No payment requests match the current filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
