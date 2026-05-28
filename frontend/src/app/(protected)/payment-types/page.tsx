'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Paginated, PaymentType } from '@/types/domain';
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
import { PaymentTypeForm, type PaymentTypeFormData } from './payment-type-form';

const KEY = 'payment-types';

export default function PaymentTypesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [deleting, setDeleting] = useState<PaymentType | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PaymentType>>(`/payment-types?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: PaymentTypeFormData) => api.post<PaymentType>('/payment-types', i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Payment type created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: PaymentTypeFormData }) => api.put<PaymentType>(`/payment-types/${id}`, i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/payment-types/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Payment Types"
        description="Configurable catalogue of payment types (SoW §1.2). Each type carries its own workflow behaviour, attachment policy, and field configuration."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New payment type</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Create payment type</DialogTitle></DialogHeader>
              <PaymentTypeForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or code" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((pt) => (
              <TableRow key={pt.id}>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{pt.code}</code>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1">
                    {pt.name}
                    {pt.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      pt.direction === 'OUTGOING'
                        ? 'inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800'
                        : 'inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800'
                    }
                  >
                    {pt.direction}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {pt.requiresApprovalChain && <span className="rounded bg-muted px-1.5 py-0.5">approval-chain</span>}
                    {pt.isBatchBased && <span className="rounded bg-muted px-1.5 py-0.5">batch</span>}
                    {pt.isConfidential && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">confidential</span>}
                    {pt.mobileInitiationOnly && <span className="rounded bg-muted px-1.5 py-0.5">mobile-only</span>}
                    {!pt.allowsCrossCurrency && <span className="rounded bg-muted px-1.5 py-0.5">single-ccy</span>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pt.documentPolicy.length === 0 ? '—' : `${pt.documentPolicy.filter((d) => d.required).length} required / ${pt.documentPolicy.length} total`}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      pt.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {pt.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(pt)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => !pt.isSystem && setDeleting(pt)}
                      disabled={pt.isSystem}
                      title={pt.isSystem ? 'System type — cannot delete, deactivate instead' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No payment types yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit payment type</DialogTitle></DialogHeader>
          {editing && (
            <PaymentTypeForm
              defaultValues={editing}
              submitting={updateMut.isPending}
              onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This will soft-delete the payment type."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
