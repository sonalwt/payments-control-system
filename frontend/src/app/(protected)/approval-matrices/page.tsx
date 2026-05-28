'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, FileEdit, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApprovalMatrix, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { ApprovalMatrixForm, type ApprovalMatrixFormData } from './approval-matrix-form';

const KEY = 'approval-matrices';

const STATUS_STYLES: Record<ApprovalMatrix['status'], string> = {
  DRAFT: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
  SUPERSEDED: 'bg-muted text-muted-foreground ring-border',
};

function MatrixDetails({ m }: { m: ApprovalMatrix }): React.ReactElement {
  const ccyCode = m.currency?.code ?? m.currency?.name ?? '';
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{m.name}</span></div>
        <div><span className="text-muted-foreground">Version:</span> v{m.version}</div>
        <div><span className="text-muted-foreground">Payment type:</span> {m.paymentType?.name ?? '—'}</div>
        <div><span className="text-muted-foreground">Currency:</span> {ccyCode || '—'}</div>
        <div><span className="text-muted-foreground">Effective from:</span> {m.effectiveFrom}</div>
        <div><span className="text-muted-foreground">Effective to:</span> {m.effectiveTo ?? '—'}</div>
      </div>
      {m.description && <div className="text-sm"><span className="text-muted-foreground">Description: </span>{m.description}</div>}

      <div className="space-y-3">
        {(m.bands ?? []).map((band) => (
          <div key={band.id ?? band.sortOrder} className="rounded-md border">
            <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm font-medium">
              <span>
                {ccyCode} {Number(band.minAmount).toLocaleString()}
                {' – '}
                {band.maxAmount == null ? 'and above' : Number(band.maxAmount).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">{band.steps.length} step{band.steps.length === 1 ? '' : 's'}</span>
            </div>
            <ol className="divide-y">
              {band.steps.map((s, i) => (
                <li key={s.id ?? i} className="px-3 py-2 text-sm flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.approverType}</span>
                  <span className="font-medium">
                    {s.approverType === 'USER' ? (s.approverUser?.fullName ?? s.approverUserId) : (s.approverRole?.name ?? s.approverRoleId)}
                  </span>
                  {s.isOptional && <span className="ml-auto text-xs text-muted-foreground">(optional)</span>}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApprovalMatricesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<ApprovalMatrix | null>(null);
  const [editing, setEditing] = useState<ApprovalMatrix | null>(null);
  const [deleting, setDeleting] = useState<ApprovalMatrix | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<ApprovalMatrix>>(`/approval-matrices?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: ApprovalMatrixFormData) => api.post<ApprovalMatrix>('/approval-matrices', i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Matrix created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: ApprovalMatrixFormData }) => api.put<ApprovalMatrix>(`/approval-matrices/${id}`, i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const publishMut = useMutation({
    mutationFn: (id: string) => api.post<ApprovalMatrix>(`/approval-matrices/${id}/publish`, {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); notify.success('Matrix published'); },
    onError: (e: Error) => notify.error('Publish failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/approval-matrices/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Approval Matrices"
        description="Per-payment-type approval bands in native currency (SoW §1.5). Matrices version with effective dates; in-flight requests retain the matrix snapshot active at submission."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New matrix</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader><DialogTitle>Create approval matrix</DialogTitle></DialogHeader>
              <ApprovalMatrixForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Payment type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Bands</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.paymentType?.name ?? '—'}</TableCell>
                <TableCell>{m.currency?.code ?? m.currency?.name ?? '—'}</TableCell>
                <TableCell>v{m.version}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.effectiveFrom}{m.effectiveTo ? ` → ${m.effectiveTo}` : ' →'}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.bands?.length ?? 0}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[m.status]}`}>
                    {m.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(m)} title="View"><Eye className="h-4 w-4" /></Button>
                    {m.status === 'DRAFT' && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(m)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => publishMut.mutate(m.id)}
                          disabled={publishMut.isPending}
                          title="Publish"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleting(m)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                    {m.status !== 'DRAFT' && (
                      <span title="Published / superseded — read-only">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No approval matrices yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Approval matrix details</DialogTitle></DialogHeader>
          {viewing && <MatrixDetails m={viewing} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Edit approval matrix</DialogTitle></DialogHeader>
          {editing && <ApprovalMatrixForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This will soft-delete the draft matrix."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
