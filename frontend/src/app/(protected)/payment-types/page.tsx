'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Paginated, PaymentType } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
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
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PaymentType>>(`/payment-types?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: PaymentTypeFormData) =>
      api.post<PaymentType>('/payment-types', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Payment type created', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Create failed', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaymentTypeFormData }) => {
      // `code` is immutable on update — strip it before sending.
      const { code: _code, ...rest } = input;
      void _code;
      return api.put<PaymentType>(`/payment-types/${id}`, rest);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      toast({ title: 'Payment type updated', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/payment-types/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      toast({ title: 'Payment type deleted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Payment Types"
        description="Configurable catalogue. Each type carries its own workflow behaviour, document policy, and field configuration."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New payment type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create payment type</DialogTitle>
              </DialogHeader>
              <PaymentTypeForm
                submitting={createMutation.isPending}
                onSubmit={(d) => createMutation.mutate(d)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Behaviour</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{pt.code}</code>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {pt.name}
                      {pt.isSystem && (
                        <span title="System type">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={pt.direction === 'OUTGOING' ? 'amber' : 'blue'}>
                      {pt.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {pt.requiresApprovalChain && <Badge>Approval</Badge>}
                    {pt.isBatchBased && <Badge>Batch</Badge>}
                    {pt.isConfidential && <Badge tone="red">Confidential</Badge>}
                    {pt.mobileInitiationOnly && <Badge>Mobile-only</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge tone={pt.isActive ? 'green' : 'gray'}>
                      {pt.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(pt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pt.isSystem}
                      onClick={() => setDeleting(pt)}
                      title={pt.isSystem ? 'System types cannot be deleted' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No payment types yet.
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit payment type</DialogTitle>
          </DialogHeader>
          {editing && (
            <PaymentTypeForm
              defaultValues={editing}
              codeLocked
              submitting={updateMutation.isPending}
              onSubmit={(d) => updateMutation.mutate({ id: editing.id, input: d })}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete payment type "${deleting?.name}"?`}
        description="Soft-deletes the payment type. System types cannot be deleted; deactivate them instead."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

type BadgeTone = 'gray' | 'green' | 'amber' | 'blue' | 'red';
function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}): React.ReactElement {
  const tones: Record<BadgeTone, string> = {
    gray: 'bg-muted text-foreground',
    green: 'bg-green-500/10 text-green-700 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    red: 'bg-destructive/10 text-destructive',
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
