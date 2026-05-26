'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  PlayCircle,
  RefreshCw,
  Unlink,
} from 'lucide-react';
import { api, friendlyError, resolveFileUrl } from '@/lib/api';
import type {
  StatementLine,
  StatementLineMatchStatus,
  StatementUpload,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/components/ui/toast';

function fmtAmount(v: string | number | null | undefined, currency?: string): string {
  if (v == null) return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ''}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

const MATCH_STYLE: Record<StatementLineMatchStatus, string> = {
  UNMATCHED: 'bg-slate-200 text-slate-700',
  CANDIDATE: 'bg-amber-100 text-amber-800',
  MATCHED: 'bg-emerald-100 text-emerald-800',
  EXCEPTION: 'bg-red-100 text-red-800',
};

function MatchBadge({ status }: { status: StatementLineMatchStatus }): React.ReactElement {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${MATCH_STYLE[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}

export default function StatementUploadDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { toast } = useToast();

  const [unmatchTarget, setUnmatchTarget] = useState<StatementLine | null>(null);
  const [unmatchReason, setUnmatchReason] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<StatementLine | null>(null);
  const [confirmNote, setConfirmNote] = useState('');

  const upload = useQuery({
    queryKey: ['statement-upload', id],
    queryFn: () => api.get<StatementUpload>(`/statement-uploads/${id}`),
  });
  const lines = useQuery({
    queryKey: ['statement-lines', id],
    queryFn: () => api.get<StatementLine[]>(`/reconciliation/uploads/${id}/lines`),
  });

  const ingestMutation = useMutation({
    mutationFn: () =>
      api.post<StatementUpload>(`/reconciliation/uploads/${id}/ingest-csv`, {
        runAutoMatch: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-upload', id] });
      void qc.invalidateQueries({ queryKey: ['statement-lines', id] });
      toast({ title: 'Statement ingested', variant: 'success' });
    },
    onError: (e: Error) =>
      toast({ title: 'Ingest failed', description: friendlyError(e), variant: 'error' }),
  });

  const rerunMutation = useMutation({
    mutationFn: () =>
      api.post<StatementUpload>(`/reconciliation/uploads/${id}/rerun-matcher`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-upload', id] });
      void qc.invalidateQueries({ queryKey: ['statement-lines', id] });
      toast({ title: 'Matcher re-run', variant: 'success' });
    },
    onError: (e: Error) =>
      toast({ title: 'Re-run failed', description: friendlyError(e), variant: 'error' }),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post<StatementLine>(`/reconciliation/lines/${confirmTarget?.id}/confirm-match`, {
        note: confirmNote || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-upload', id] });
      void qc.invalidateQueries({ queryKey: ['statement-lines', id] });
      setConfirmTarget(null);
      setConfirmNote('');
      toast({ title: 'Match confirmed', variant: 'success' });
    },
    onError: (e: Error) =>
      toast({ title: 'Confirm failed', description: friendlyError(e), variant: 'error' }),
  });

  const unmatchMutation = useMutation({
    mutationFn: () =>
      api.post<StatementLine>(`/reconciliation/lines/${unmatchTarget?.id}/unmatch`, {
        reason: unmatchReason,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-upload', id] });
      void qc.invalidateQueries({ queryKey: ['statement-lines', id] });
      setUnmatchTarget(null);
      setUnmatchReason('');
      toast({ title: 'Line moved to exception', variant: 'success' });
    },
    onError: (e: Error) =>
      toast({ title: 'Unmatch failed', description: friendlyError(e), variant: 'error' }),
  });

  const data = upload.data;
  const linesData = lines.data ?? [];
  const ingestionStatus = data?.ingestionStatus ?? 'UPLOADED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          data
            ? `Statement · ${data.bankAccount?.nickname ?? '—'} · ${fmtDate(data.statementDate)}`
            : 'Statement Upload'
        }
        description={
          data
            ? `Account ${data.bankAccount?.accountNumber ?? ''} · ${data.bankAccount?.currency?.code ?? ''}`
            : ''
        }
        actions={
          <div className="flex gap-2">
            <Link href="/statement-uploads">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </Link>
            {data?.fileUrl && (
              <a href={resolveFileUrl(data.fileUrl)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </Button>
              </a>
            )}
            {data && ingestionStatus === 'UPLOADED' && (
              <Button
                size="sm"
                onClick={() => ingestMutation.mutate()}
                disabled={ingestMutation.isPending}
              >
                <PlayCircle className="mr-1 h-4 w-4" />
                {ingestMutation.isPending ? 'Ingesting…' : 'Ingest & Auto-Match'}
              </Button>
            )}
            {data && (ingestionStatus === 'PARSED' || ingestionStatus === 'MATCHED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => rerunMutation.mutate()}
                disabled={rerunMutation.isPending}
              >
                <RefreshCw
                  className={`mr-1 h-4 w-4 ${rerunMutation.isPending ? 'animate-spin' : ''}`}
                />
                Re-run matcher
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <SummaryCard
          label="Opening"
          value={fmtAmount(data?.openingBalance, data?.bankAccount?.currency?.code)}
        />
        <SummaryCard
          label="Closing"
          value={fmtAmount(data?.closingBalance, data?.bankAccount?.currency?.code)}
        />
        <SummaryCard label="Matched" value={String(data?.matchedCount ?? 0)} tone="emerald" />
        <SummaryCard label="Candidate" value={String(data?.candidateCount ?? 0)} tone="amber" />
        <SummaryCard label="Exception" value={String(data?.exceptionCount ?? 0)} tone="red" />
      </div>

      {ingestionStatus === 'PARSE_FAILED' && data?.ingestionError && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Parse failed</p>
          <p className="mt-1 text-xs">{data.ingestionError}</p>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Value Date</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Bank Reference</TableHead>
              <TableHead>Counterparty / Narrative</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Matched To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Loading lines…
                </TableCell>
              </TableRow>
            ) : linesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {ingestionStatus === 'UPLOADED'
                    ? 'No lines yet — click Ingest & Auto-Match to parse the file.'
                    : 'No lines on this statement.'}
                </TableCell>
              </TableRow>
            ) : (
              linesData.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">{l.lineIndex}</TableCell>
                  <TableCell className="text-sm">{fmtDate(l.valueDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium ${
                        l.direction === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {l.direction}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtAmount(l.amount, l.currencyCode)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.bankReference ?? '—'}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs" title={l.narrative ?? ''}>
                    <p>{l.counterpartyText ?? '—'}</p>
                    <p className="text-muted-foreground">{l.narrative ?? ''}</p>
                  </TableCell>
                  <TableCell>
                    <MatchBadge status={l.matchStatus} />
                    {l.matchScore && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        {Number(l.matchScore).toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.matchedPaymentRequest ? (
                      <Link
                        href={`/payment-requests/${l.matchedPaymentRequest.id}`}
                        className="text-primary hover:underline"
                      >
                        {l.matchedPaymentRequest.requestNumber}
                      </Link>
                    ) : l.matchedIncomingReceipt ? (
                      <Link
                        href={`/incoming-receipts/${l.matchedIncomingReceipt.id}`}
                        className="text-primary hover:underline"
                      >
                        {l.matchedIncomingReceipt.receiptNumber}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {l.matchReason && (
                      <p className="text-[10px] text-muted-foreground" title={l.matchReason}>
                        {l.matchReason.length > 60
                          ? l.matchReason.slice(0, 57) + '…'
                          : l.matchReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {l.matchStatus === 'CANDIDATE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-emerald-600"
                        onClick={() => setConfirmTarget(l)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Confirm
                      </Button>
                    )}
                    {(l.matchStatus === 'MATCHED' || l.matchStatus === 'CANDIDATE') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-600"
                        onClick={() => setUnmatchTarget(l)}
                      >
                        <Unlink className="mr-1 h-3.5 w-3.5" />
                        Unmatch
                      </Button>
                    )}
                    {l.matchStatus === 'EXCEPTION' && l.exceptionId && (
                      <Link
                        href={`/reconciliation-exceptions?statementUploadId=${id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View exception
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm candidate match</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Confirm that this statement line corresponds to the suggested record. Once confirmed
              the line is locked as MATCHED and any related exception is closed.
            </p>
            {confirmTarget && (
              <Card className="bg-muted/40 p-3 text-xs">
                <p className="font-mono">
                  {confirmTarget.direction}{' '}
                  {fmtAmount(confirmTarget.amount, confirmTarget.currencyCode)} ·{' '}
                  {fmtDate(confirmTarget.valueDate)}
                </p>
                <p className="mt-1">
                  Candidate:{' '}
                  {confirmTarget.matchedPaymentRequest?.requestNumber ??
                    confirmTarget.matchedIncomingReceipt?.receiptNumber ??
                    '—'}
                </p>
                {confirmTarget.matchReason && (
                  <p className="mt-1 text-muted-foreground">{confirmTarget.matchReason}</p>
                )}
              </Card>
            )}
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Textarea
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                rows={2}
                placeholder="e.g. matched manually after checking bank statement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? 'Saving…' : 'Confirm match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unmatch dialog */}
      <Dialog open={!!unmatchTarget} onOpenChange={(o) => !o && setUnmatchTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unmatch statement line</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Unmatching a line routes it to the §8.3 exception queue for senior review. Provide a
              reason so the auditor can follow the trail.
            </p>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Input
                value={unmatchReason}
                onChange={(e) => setUnmatchReason(e.target.value)}
                placeholder="Why the suggested match is incorrect"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnmatchTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => unmatchMutation.mutate()}
              disabled={unmatchMutation.isPending || !unmatchReason.trim()}
            >
              {unmatchMutation.isPending ? 'Saving…' : 'Move to exception'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'amber' | 'red';
}): React.ReactElement {
  const colour =
    tone === 'emerald'
      ? 'text-emerald-600'
      : tone === 'amber'
        ? 'text-amber-600'
        : tone === 'red'
          ? 'text-red-600'
          : '';
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg ${colour}`}>{value}</p>
    </Card>
  );
}
