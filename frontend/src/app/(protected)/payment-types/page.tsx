'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApprovalMatrix, Paginated, PaymentType, Role } from '@/types/domain';
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
import { PaymentTypeMasterForm, type PaymentTypeMasterSubmit } from './payment-type-master-form';

const KEY = 'payment-types';

/** Resolve a payment type's maker role IDs to a comma-separated label. */
function makerRolesText(pt: PaymentType, roleNameById: Map<string, string>): string {
  const ids =
    pt.makerRoleIds && pt.makerRoleIds.length
      ? pt.makerRoleIds
      : pt.makerRoleId
        ? [pt.makerRoleId]
        : [];
  const names = ids.map((id) => roleNameById.get(id)).filter(Boolean) as string[];
  if (names.length) return names.join(', ');
  return pt.makerRole?.name ?? '—';
}

function PaymentTypeDetails({ pt, makerLabel }: { pt: PaymentType; makerLabel: string }): React.ReactElement {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Code</p>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{pt.code}</code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium inline-flex items-center gap-1">
            {pt.name}
            {pt.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Category</p>
          <p>{pt.paymentCategory?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Legal entity</p>
          <p>{pt.legalEntity?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Direction</p>
          <span
            className={
              pt.direction === 'OUTGOING'
                ? 'inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800'
                : 'inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800'
            }
          >
            {pt.direction}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payment request creator roles (Maker)</p>
          <p>{makerLabel}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payment request checker</p>
          <p>{pt.checkerRole?.name ?? '—'}</p>
        </div>
      </div>

      {pt.description && (
        <div>
          <p className="text-xs text-muted-foreground">Description</p>
          <p>{pt.description}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-1">Workflow</p>
        <div className="flex flex-wrap gap-1">
          {pt.requiresApprovalChain && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">approval-chain</span>}
          {pt.isBatchBased && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">batch</span>}
          {pt.isConfidential && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">confidential</span>}
          {pt.mobileInitiationOnly && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">mobile-only</span>}
          {!pt.allowsCrossCurrency && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">single-ccy</span>}
          <span
            className={
              pt.isActive
                ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
            }
          >
            {pt.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentTypesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<PaymentType | null>(null);
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

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });
  const roleNameById = useMemo(
    () => new Map((roles ?? []).map((r) => [r.id, r.name])),
    [roles],
  );

  // Existing approval matrix for the type being edited, so the combined form
  // can prefill it and we know whether to PUT (update) or POST (create) it.
  // Filtered client-side from the matrices list so the backend stays untouched.
  const { data: allMatrices } = useQuery({
    queryKey: ['approval-matrices', 'all-for-master'],
    queryFn: () => api.get<Paginated<ApprovalMatrix>>('/approval-matrices?page=1&limit=200'),
    enabled: !!editing,
  });
  const editingMatrix = editing
    ? allMatrices?.data.find((m) => m.paymentTypeId === editing.id) ?? null
    : null;

  // Invalidate both catalogues — a single save can touch both tables.
  const invalidateBoth = (): void => {
    void qc.invalidateQueries({ queryKey: [KEY] });
    void qc.invalidateQueries({ queryKey: ['approval-matrices'] });
  };

  const createMut = useMutation({
    mutationFn: async (s: PaymentTypeMasterSubmit) => {
      const pt = await api.post<PaymentType>('/payment-types', s.paymentType);
      if (s.matrix) {
        await api.post<ApprovalMatrix>('/approval-matrices', { ...s.matrix, paymentTypeId: pt.id });
      }
      return pt;
    },
    onSuccess: () => { invalidateBoth(); setCreateOpen(false); notify.success('Payment type created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: async ({ id, s, matrixId }: { id: string; s: PaymentTypeMasterSubmit; matrixId: string | null }) => {
      await api.put<PaymentType>(`/payment-types/${id}`, s.paymentType);
      if (s.matrix) {
        if (matrixId) {
          await api.put<ApprovalMatrix>(`/approval-matrices/${matrixId}`, { ...s.matrix, paymentTypeId: id });
        } else {
          await api.post<ApprovalMatrix>('/approval-matrices', { ...s.matrix, paymentTypeId: id });
        }
      }
    },
    onSuccess: () => { invalidateBoth(); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/payment-types/${id}`),
    onSuccess: () => { invalidateBoth(); setDeleting(null); notify.success('Deleted'); },
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
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create payment type</DialogTitle></DialogHeader>
              <PaymentTypeMasterForm submitting={createMut.isPending} onSubmit={(s) => createMut.mutate(s)} />
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
              <TableHead>Legal Entity</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Maker</TableHead>
              <TableHead>Checker</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
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
                <TableCell className="text-sm">{pt.legalEntity?.name ?? '—'}</TableCell>
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
                <TableCell className="text-sm">{makerRolesText(pt, roleNameById)}</TableCell>
                <TableCell className="text-sm">{pt.checkerRole?.name ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {pt.requiresApprovalChain && <span className="rounded bg-muted px-1.5 py-0.5">approval-chain</span>}
                    {pt.isBatchBased && <span className="rounded bg-muted px-1.5 py-0.5">batch</span>}
                    {pt.isConfidential && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">confidential</span>}
                    {pt.mobileInitiationOnly && <span className="rounded bg-muted px-1.5 py-0.5">mobile-only</span>}
                    {!pt.allowsCrossCurrency && <span className="rounded bg-muted px-1.5 py-0.5">single-ccy</span>}
                  </div>
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
                    <Button size="icon" variant="ghost" onClick={() => setViewing(pt)} title="View"><Eye className="h-4 w-4" /></Button>
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
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No payment types yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Payment type details</DialogTitle></DialogHeader>
          {viewing && <PaymentTypeDetails pt={viewing} makerLabel={makerRolesText(viewing, roleNameById)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit payment type</DialogTitle></DialogHeader>
          {editing && (
            <PaymentTypeMasterForm
              // Remount when the matrix finishes loading so its values prefill.
              key={editingMatrix?.id ?? editing.id}
              paymentType={editing}
              matrix={editingMatrix}
              submitting={updateMut.isPending}
              onSubmit={(s) => updateMut.mutate({ id: editing.id, s, matrixId: editingMatrix?.id ?? null })}
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
