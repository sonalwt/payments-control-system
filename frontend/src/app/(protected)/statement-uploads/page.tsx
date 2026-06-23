'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus, Trash2, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateMedium } from '@/lib/datetime';
import type { BankAccount, Paginated, StatementUpload } from '@/types/domain';
import { FileActions } from '@/components/shared/file-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';

// -----------------------------------------------------------------------

function fmtDate(d: string | undefined | null): string {
  return formatDateMedium(d);
}

function fmtBalance(v: string | number | undefined | null): string {
  if (v == null) return '—';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function IngestionBadge({
  status,
  format,
}: {
  status?: StatementUpload['ingestionStatus'];
  format?: StatementUpload['ingestionFormat'];
}): React.ReactElement {
  const effective = status ?? 'UPLOADED';
  const colour =
    effective === 'MATCHED'
      ? 'bg-emerald-100 text-emerald-800'
      : effective === 'PARSED'
        ? 'bg-blue-100 text-blue-800'
        : effective === 'PARSE_FAILED'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${colour}`}>
      {effective.toLowerCase()}
      {format ? ` · ${format}` : ''}
    </span>
  );
}

// -----------------------------------------------------------------------

export default function StatementUploadsPage(): React.ReactElement {
  const qc = useQueryClient();
  const notify = useNotify();

  const [filterAccountId, setFilterAccountId] = useState('');
  const [page, setPage] = useState(1);

  // Upload form state
  const [formOpen, setFormOpen] = useState(false);
  const [formAccountId, setFormAccountId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formOpeningBal, setFormOpeningBal] = useState('');
  const [formClosingBal, setFormClosingBal] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formUploading, setFormUploading] = useState(false);

  function resetForm() {
    setFormAccountId('');
    setFormDate('');
    setFormOpeningBal('');
    setFormClosingBal('');
    setFormFileUrl('');
    setFormFileName('');
    setFormNotes('');
  }

  // Bank accounts for the form dropdown. Same constraint — pass only
  // page/limit and filter active accounts client-side.
  const { data: accountsData } = useQuery({
    queryKey: ['bank-accounts-for-statements'],
    queryFn: () => api.get<Paginated<BankAccount>>('/bank-accounts?page=1&limit=200'),
  });

  // Statement uploads list
  const { data: uploadsData, isLoading } = useQuery({
    queryKey: ['statement-uploads', filterAccountId, page],
    queryFn: () =>
      api.get<Paginated<StatementUpload>>(
        `/statement-uploads?page=${page}&limit=20${filterAccountId ? `&bankAccountId=${filterAccountId}` : ''}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/statement-uploads', {
        bankAccountId: formAccountId,
        statementDate: formDate,
        openingBalance: parseFloat(formOpeningBal),
        closingBalance: parseFloat(formClosingBal),
        fileUrl: formFileUrl,
        notes: formNotes || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-uploads'] });
      setFormOpen(false);
      resetForm();
      notify.success('Statement uploaded');
    },
    onError: (e: Error) => notify.error('Upload failed', e),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/statement-uploads/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['statement-uploads'] });
      notify.success('Statement removed');
    },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  const accounts = (accountsData?.data ?? []).filter((a) => a.isActive);
  const uploads = uploadsData?.data ?? [];
  const totalPages = uploadsData?.totalPages ?? 1;

  const isFormValid =
    formAccountId &&
    formDate &&
    formOpeningBal !== '' &&
    formClosingBal !== '' &&
    formFileUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statement Uploads"
        description="Upload and track bank statement files for reconciliation."
        actions={
          <Dialog
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> New Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Bank Statement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Bank Account *</Label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                  >
                    <option value="">— select —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nickname} — {a.currency?.code ?? ''} — {a.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Statement Date *</Label>
                  <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Opening Balance *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formOpeningBal}
                      onChange={(e) => setFormOpeningBal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Closing Balance *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formClosingBal}
                      onChange={(e) => setFormClosingBal(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Statement File *
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (PDF, CSV, or Excel)
                    </span>
                  </Label>
                  {formFileUrl ? (
                    <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm">
                      <UploadCloud className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-xs">{formFileName}</span>
                      <button
                        type="button"
                        onClick={() => { setFormFileUrl(''); setFormFileName(''); }}
                        className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed bg-background px-3 text-sm text-muted-foreground hover:bg-muted/50">
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {formUploading ? 'Uploading…' : 'Click to attach statement file…'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setFormUploading(true);
                          try {
                            const result = await api.upload(file);
                            setFormFileName(result.fileName);
                            setFormFileUrl(result.url);
                          } catch {
                            notify.error('Upload failed');
                          } finally {
                            setFormUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optional notes about this statement…"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !isFormValid}
                >
                  <UploadCloud className="mr-1 h-4 w-4" />
                  {createMutation.isPending ? 'Saving…' : 'Upload Statement'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Bank Account</Label>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={filterAccountId}
              onChange={(e) => { setFilterAccountId(e.target.value); setPage(1); }}
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname} ({a.currency?.code ?? ''})
                </option>
              ))}
            </select>
          </div>
          {filterAccountId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterAccountId('');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Statement Date</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Closing Balance</TableHead>
              <TableHead>Ingestion</TableHead>
              <TableHead className="text-right">Match Summary</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : uploads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No statement uploads found.
                </TableCell>
              </TableRow>
            ) : (
              uploads.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{u.bankAccount?.nickname ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.bankAccount?.bank?.name ?? ''} · {u.bankAccount?.currency?.code ?? ''}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(u.statementDate)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtBalance(u.openingBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtBalance(u.closingBalance)}
                  </TableCell>
                  <TableCell>
                    <IngestionBadge status={u.ingestionStatus} format={u.ingestionFormat} />
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {!u.ingestionStatus || u.ingestionStatus === 'UPLOADED' ? (
                      <span className="text-muted-foreground">— pending —</span>
                    ) : (
                      <span className="space-x-2 font-mono">
                        <span className="text-emerald-600">{u.matchedCount ?? 0} ✓</span>
                        <span className="text-amber-600">{u.candidateCount ?? 0} ?</span>
                        <span className="text-red-600">{u.exceptionCount ?? 0} !</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(u.uploader as { fullName?: string } | undefined)?.fullName ?? u.uploadedBy}
                    <br />
                    {fmtDate(u.createdAt as unknown as string)}
                  </TableCell>
                  <TableCell>
                    {u.fileUrl ? (
                      <FileActions fileUrl={u.fileUrl} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/statement-uploads/${u.id}`}
                      className="mr-1 inline-flex h-7 items-center rounded px-2 text-xs text-primary hover:bg-muted"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Reconcile
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Remove this statement upload?')) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
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
    </div>
  );
}
