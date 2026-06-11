'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, FileText, Pencil, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, todayInDubai } from '@/lib/datetime';
import { FileActions } from '@/components/shared/file-actions';
import type {
  BankAccount,
  IncomingReceipt,
  IncomingReceiptDocument,
  IncomingReceiptStatus,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';

const KEY = 'incoming-receipts';

const STATUS_LABEL: Record<IncomingReceiptStatus, string> = {
  DRAFT: 'Draft',
  AWAITING_RECEIPT: 'Awaiting Receipt',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<IncomingReceiptStatus, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  AWAITING_RECEIPT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  RECEIVED: 'bg-green-700/10 text-green-800 dark:text-green-300',
  CANCELLED: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: IncomingReceiptStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function IncomingReceiptDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const notify = useNotify();

  const ir = useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<IncomingReceipt>(`/incoming-receipts/${id}`),
  });

  const docs = useQuery({
    queryKey: [KEY, id, 'docs'],
    queryFn: () => api.get<IncomingReceiptDocument[]>(`/incoming-receipts/${id}/documents`),
  });

  // Bank accounts aren't linked to a legal entity, and the list endpoint only
  // whitelists page/limit/search — so fetch all and filter active client-side.
  const bankAccounts = useQuery({
    queryKey: ['bank-accounts-all'],
    queryFn: () => api.get<Paginated<BankAccount>>('/bank-accounts?page=1&limit=200'),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post<IncomingReceipt>(`/incoming-receipts/${id}/submit`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY, id] });
      notify.success('Submitted — awaiting receipt');
    },
    onError: (err: Error) =>
      notify.error('Submit failed', err),
  });

  const [showForm, setShowForm] = useState(false);
  const [receiveFromAccountId, setReceiveFromAccountId] = useState('');
  const [inwardRef, setInwardRef] = useState('');
  const [receivedDate, setReceivedDate] = useState(todayInDubai());
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receivedCurrencyCode, setReceivedCurrencyCode] = useState('');
  const [remarks, setRemarks] = useState('');

  const markReceivedMutation = useMutation({
    mutationFn: () =>
      api.post<IncomingReceipt>(`/incoming-receipts/${id}/mark-received`, {
        receiveFromAccountId,
        inwardBankReference: inwardRef,
        receivedDate,
        receivedAmount,
        receivedCurrencyCode: receivedCurrencyCode.toUpperCase(),
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      notify.success('Marked received — account credited');
      setShowForm(false);
    },
    onError: (err: Error) =>
      notify.error('Mark received failed', err),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post<IncomingReceipt>(`/incoming-receipts/${id}/cancel`, { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      notify.success('Cancelled');
    },
    onError: (err: Error) =>
      notify.error('Cancel failed', err),
  });

  if (ir.isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!ir.data) return <div className="p-6 text-sm text-muted-foreground">Not found.</div>;

  const r = ir.data;
  const documents = docs.data ?? [];
  const accountOpts = (bankAccounts.data?.data ?? []).filter((a) => a.isActive);

  const canSubmit = r.status === 'DRAFT';
  const canMarkReceived = r.status === 'AWAITING_RECEIPT';
  const canCancel = r.status === 'DRAFT' || r.status === 'AWAITING_RECEIPT';

  const openMarkReceived = () => {
    setReceiveFromAccountId(r.receiveFromAccountId ?? '');
    setReceivedAmount(r.expectedAmount);
    setReceivedCurrencyCode(r.expectedCurrencyCode);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Incoming Receipt ${r.receiptNumber}`}
        description="SOW §7 — inbound credit from counterparty."
        actions={
          <Link href="/incoming-receipts">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <StatusBadge status={r.status} />
            </div>
          </div>
          <div className="flex gap-2">
            {canSubmit && (
              <Link href={`/incoming-receipts/${id}/edit`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </Link>
            )}
            {canSubmit && (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" /> Submit
              </Button>
            )}
            {canMarkReceived && !showForm && (
              <Button onClick={openMarkReceived}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Received
              </Button>
            )}
            {canCancel && (
              <Button
                variant="ghost"
                onClick={() => {
                  const reason = prompt('Cancellation reason?');
                  if (reason) cancelMutation.mutate(reason);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Counterparty" value={r.counterparty?.name ?? '—'} />
          <Field label="Legal Entity" value={r.legalEntity?.name ?? '—'} />
          <Field label="Expected Amount" value={`${r.expectedAmount} ${r.expectedCurrencyCode}`} />
          <Field label="Receive-to Account" value={r.receiveFromAccount?.bankNickname ?? r.receiveFromAccount?.bankName ?? '—'} />
          {r.receivedFromAccount && (
            <Field label="Received-from Account" value={r.receivedFromAccount} />
          )}
          {r.purposeDescription && (
            <Field className="md:col-span-2" label="Purpose" value={r.purposeDescription} />
          )}
          {r.cancellationReason && (
            <Field
              className="md:col-span-2"
              label="Cancellation reason"
              value={r.cancellationReason}
            />
          )}
        </div>
      </Card>

      {r.status === 'RECEIVED' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold">Credit Received</h3>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <Field
              label="Received Amount"
              value={`${r.receivedAmount ?? '—'} ${r.receivedCurrencyCode ?? ''}`}
            />
            <Field label="Inward Bank Reference" value={r.inwardBankReference ?? '—'} mono />
            <Field
              label="Received On"
              value={formatDateTime(r.receivedAt)}
            />
            {r.receivedRemarks && (
              <Field className="md:col-span-2" label="Remarks" value={r.receivedRemarks} />
            )}
          </div>
        </Card>
      )}

      {showForm && canMarkReceived && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold">Mark Credit Received (SOW §7.3)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="rf-acct">Receive-to Account *</Label>
              <select
                id="rf-acct"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={receiveFromAccountId}
                onChange={(e) => setReceiveFromAccountId(e.target.value)}
              >
                <option value="">Select…</option>
                {accountOpts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankNickname ?? a.bankName ?? 'Account'} — {a.accountNumber} ({a.currency?.code ?? '—'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="inward-ref">Inward Bank Reference *</Label>
              <Input
                id="inward-ref"
                value={inwardRef}
                onChange={(e) => setInwardRef(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recv-date">Received Date *</Label>
              <Input
                id="recv-date"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recv-amt">Received Amount *</Label>
              <Input
                id="recv-amt"
                type="number"
                step="0.01"
                min="0"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recv-ccy">Received Currency *</Label>
              <Input
                id="recv-ccy"
                value={receivedCurrencyCode}
                onChange={(e) => setReceivedCurrencyCode(e.target.value)}
                className="mt-1"
                maxLength={3}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => markReceivedMutation.mutate()}
              disabled={
                !receiveFromAccountId ||
                !inwardRef ||
                !receivedAmount ||
                !receivedCurrencyCode ||
                markReceivedMutation.isPending
              }
            >
              {markReceivedMutation.isPending ? 'Saving…' : 'Confirm Received'}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-3 text-sm font-semibold">Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents attached.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{d.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  ({d.documentLabel ?? d.documentCode})
                </span>
                <FileActions className="ml-auto" fileUrl={d.fileUrl} fileName={d.fileName} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
