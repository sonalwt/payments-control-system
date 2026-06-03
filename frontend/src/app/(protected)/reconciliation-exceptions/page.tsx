'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import { formatDateMedium } from '@/lib/datetime';
import type {
  Paginated,
  ReconciliationException,
  ReconciliationExceptionStatus,
  ReconciliationExceptionType,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNotify } from '@/hooks/use-notify';

const STATUS_STYLE: Record<ReconciliationExceptionStatus, string> = {
  OPEN: 'bg-red-100 text-red-800',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-800',
  RESOLVED_WITH_JUSTIFICATION: 'bg-emerald-100 text-emerald-800',
  CONFIRMED_EXCEPTION: 'bg-slate-800 text-slate-100',
};

const TYPE_LABEL: Record<ReconciliationExceptionType, string> = {
  UNAUTHORISED_PAYMENT: 'Unauthorised Payment',
  UNIDENTIFIED_RECEIPT: 'Unidentified Receipt',
};

function fmtDate(d: string | null | undefined): string {
  return formatDateMedium(d);
}

function fmtAmount(v: string | null | undefined, ccy?: string): string {
  if (v == null) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${ccy ? ` ${ccy}` : ''}`;
}

type Action = 'INVESTIGATE' | 'RESOLVE' | 'CONFIRM';

export default function ReconciliationExceptionsPage(): React.ReactElement {
  const sp = useSearchParams();
  const initialUploadFilter = sp?.get('statementUploadId') ?? '';

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReconciliationExceptionStatus | ''>('');
  const [exceptionType, setType] = useState<ReconciliationExceptionType | ''>('');
  const [uploadId] = useState(initialUploadFilter);

  const [actionTarget, setActionTarget] = useState<{
    exception: ReconciliationException;
    action: Action;
  } | null>(null);
  const [noteText, setNoteText] = useState('');

  const notify = useNotify();
  const qc = useQueryClient();

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  if (status) params.set('status', status);
  if (exceptionType) params.set('exceptionType', exceptionType);
  if (uploadId) params.set('statementUploadId', uploadId);

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliation-exceptions', page, status, exceptionType, uploadId],
    queryFn: () =>
      api.get<Paginated<ReconciliationException>>(
        `/reconciliation-exceptions?${params.toString()}`,
      ),
  });

  const actionMutation = useMutation({
    mutationFn: () => {
      const ex = actionTarget!.exception;
      const action = actionTarget!.action;
      if (action === 'INVESTIGATE') {
        return api.post(`/reconciliation-exceptions/${ex.id}/start-investigation`, {
          note: noteText || undefined,
        });
      }
      if (action === 'RESOLVE') {
        return api.post(`/reconciliation-exceptions/${ex.id}/resolve`, {
          resolutionNote: noteText,
        });
      }
      return api.post(`/reconciliation-exceptions/${ex.id}/confirm`, {
        resolutionNote: noteText,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
      setActionTarget(null);
      setNoteText('');
      notify.success('Exception updated');
    },
    onError: (e: Error) =>
      notify.error('Action failed'),
  });

  const exceptions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openAction = (exception: ReconciliationException, action: Action) => {
    setActionTarget({ exception, action });
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation Exceptions"
        description="Unmatched bank statement entries: unauthorised payments and unidentified receipts (§8.3)."
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ReconciliationExceptionStatus | '');
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_INVESTIGATION">Under investigation</option>
              <option value="RESOLVED_WITH_JUSTIFICATION">Resolved</option>
              <option value="CONFIRMED_EXCEPTION">Confirmed</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={exceptionType}
              onChange={(e) => {
                setType(e.target.value as ReconciliationExceptionType | '');
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="UNAUTHORISED_PAYMENT">Unauthorised Payment</option>
              <option value="UNIDENTIFIED_RECEIPT">Unidentified Receipt</option>
            </select>
          </div>
          {(status || exceptionType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('');
                setType('');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Value Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Counterparty / Narrative</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : exceptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No exceptions found.
                </TableCell>
              </TableRow>
            ) : (
              exceptions.map((ex) => {
                const isClosed =
                  ex.status === 'RESOLVED_WITH_JUSTIFICATION' ||
                  ex.status === 'CONFIRMED_EXCEPTION';
                return (
                  <TableRow key={ex.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/statement-uploads/${ex.statementUploadId}`}
                        className="text-primary hover:underline"
                      >
                        {ex.exceptionNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          ex.exceptionType === 'UNAUTHORISED_PAYMENT'
                            ? 'text-red-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {ex.exceptionType === 'UNAUTHORISED_PAYMENT' ? (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        ) : (
                          <FileSearch className="h-3.5 w-3.5" />
                        )}
                        {TYPE_LABEL[ex.exceptionType]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <p>{ex.bankAccount?.nickname ?? '—'}</p>
                      <p className="text-muted-foreground">
                        {ex.bankAccount?.bank?.name ?? ''} · {ex.bankAccount?.currency?.code ?? ''}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(ex.valueDate)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtAmount(ex.amount, ex.currencyCode)}
                    </TableCell>
                    <TableCell className="max-w-[280px] text-xs">
                      <p>{ex.counterpartyText ?? '—'}</p>
                      <p className="truncate text-muted-foreground" title={ex.narrative ?? ''}>
                        {ex.narrative ?? ''}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {ex.bankReference ?? ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs ${STATUS_STYLE[ex.status]}`}
                      >
                        {ex.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      {!isClosed && ex.status === 'OPEN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => openAction(ex, 'INVESTIGATE')}
                        >
                          <FileSearch className="mr-1 h-3.5 w-3.5" />
                          Investigate
                        </Button>
                      )}
                      {!isClosed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-emerald-600"
                          onClick={() => openAction(ex, 'RESOLVE')}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Resolve
                        </Button>
                      )}
                      {!isClosed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-700"
                          onClick={() => openAction(ex, 'CONFIRM')}
                        >
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Confirm
                        </Button>
                      )}
                      {isClosed && ex.resolutionNote && (
                        <span
                          className="text-[10px] text-muted-foreground"
                          title={ex.resolutionNote}
                        >
                          closed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === 'INVESTIGATE'
                ? 'Start investigation'
                : actionTarget?.action === 'RESOLVE'
                  ? 'Resolve with justification'
                  : 'Confirm exception'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {actionTarget && (
              <Card className="bg-muted/40 p-3 text-xs">
                <p className="font-mono">
                  {actionTarget.exception.exceptionNumber} ·{' '}
                  {TYPE_LABEL[actionTarget.exception.exceptionType]}
                </p>
                <p className="mt-1">
                  {fmtAmount(actionTarget.exception.amount, actionTarget.exception.currencyCode)}{' '}
                  · {fmtDate(actionTarget.exception.valueDate)}
                </p>
                {actionTarget.exception.narrative && (
                  <p className="mt-1 text-muted-foreground">{actionTarget.exception.narrative}</p>
                )}
              </Card>
            )}
            <div className="space-y-1.5">
              <Label>
                {actionTarget?.action === 'INVESTIGATE'
                  ? 'Note (optional)'
                  : 'Resolution note *'}
              </Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder={
                  actionTarget?.action === 'CONFIRM'
                    ? 'Why this debit/credit is confirmed as unauthorised/unidentified'
                    : actionTarget?.action === 'RESOLVE'
                      ? 'Explanation that justifies closing this exception'
                      : 'Optional context for the investigation'
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => actionMutation.mutate()}
              disabled={
                actionMutation.isPending ||
                (actionTarget?.action !== 'INVESTIGATE' && !noteText.trim())
              }
              variant={actionTarget?.action === 'CONFIRM' ? 'destructive' : 'default'}
            >
              {actionMutation.isPending ? 'Saving…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
