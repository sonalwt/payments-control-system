'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Counterparty, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

const KEY = 'counterparty-kyc';
type Filter = 'PENDING' | 'FLAGGED' | 'ALL';

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export default function CounterpartyKycPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [rejecting, setRejecting] = useState<Counterparty | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter !== 'ALL') u.set('filter', filter);
    return u.toString();
  }, [page, filter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Counterparty>>(`/counterparties/kyc/list?${params}`),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.post<Counterparty>(`/counterparties/${id}/kyc/approve`, {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); notify.success('Counterparty approved'); },
    onError: (e: Error) => notify.error('Approve failed', e),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<Counterparty>(`/counterparties/${id}/kyc/reject`, { reason }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setRejecting(null); notify.success('Counterparty rejected'); },
    onError: (e: Error) => notify.error('Reject failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Counterparty KYC"
        description="Review counterparties raised by initiators. Trade counterparties need your approval before they can be used; Non-Trade additions are usable but flagged here for review."
        actions={<ShieldCheck className="h-6 w-6 text-muted-foreground" />}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Label className="text-xs text-muted-foreground">Show</Label>
          <Select
            className="w-48"
            options={[
              { label: 'Needs attention (all)', value: 'ALL' },
              { label: 'Pending approval (Trade)', value: 'PENDING' },
              { label: 'Flagged (Non-Trade)', value: 'FLAGGED' },
            ]}
            value={filter}
            onChange={(e) => { setPage(1); setFilter(e.target.value as Filter); }}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>KYC status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((cp) => (
              <TableRow key={cp.id}>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{cp.code}</code></TableCell>
                <TableCell className="font-medium">
                  <div>{cp.name}</div>
                  {cp.legalName && <div className="text-xs text-muted-foreground">{cp.legalName}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cp.paymentNature === 'TRADE' ? 'Trade' : cp.paymentNature === 'NON_TRADE' ? 'Non-Trade' : '—'}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[cp.kycStatus] ?? STATUS_STYLES.PENDING}`}>
                      {cp.kycStatus === 'APPROVED' ? 'Approved' : cp.kycStatus === 'REJECTED' ? 'Rejected' : 'Pending'}
                    </span>
                    {cp.kycFlagged && (
                      <span className="inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-200">review</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {cp.primaryContactEmail ?? cp.primaryContactName ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button size="sm" variant="outline" disabled={approveMut.isPending || (cp.kycStatus === 'APPROVED' && !cp.kycFlagged)} onClick={() => approveMut.mutate(cp.id)}>
                      <BadgeCheck className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" disabled={cp.kycStatus === 'REJECTED'} onClick={() => setRejecting(cp)}>
                      <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Nothing to review.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <RejectDialog
        cp={rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        submitting={rejectMut.isPending}
        onSubmit={(reason) => rejecting && rejectMut.mutate({ id: rejecting.id, reason })}
      />
    </div>
  );
}

function RejectDialog({
  cp, onOpenChange, onSubmit, submitting,
}: {
  cp: Counterparty | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (reason: string) => void;
  submitting?: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <Dialog open={!!cp} onOpenChange={(o) => { if (!o) setReason(''); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject counterparty</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Rejecting {cp?.name} ({cp?.code}). It cannot be used in payment requests. The creator is notified with your reason.
          </p>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
          <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this counterparty being rejected?" />
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={submitting || reason.trim().length < 5} onClick={() => onSubmit(reason.trim())}>
            {submitting ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
