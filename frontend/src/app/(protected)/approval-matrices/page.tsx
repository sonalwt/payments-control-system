'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  ApprovalMatrix,
  ApprovalMatrixStatus,
  Currency,
  Paginated,
  PaymentType,
  Role,
  User,
} from '@/types/domain';
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import {
  ApprovalMatrixForm,
  type MatrixFormData,
} from './approval-matrix-form';

const KEY = 'approval-matrices';

type CreatePayload = {
  name: string;
  description?: string | null;
  paymentTypeCode: string;
  effectiveFrom: string;
  bands: {
    currencyCode: string;
    minAmountMinor: number;
    maxAmountMinor: number | null;
    sortOrder?: number;
    steps: {
      stepOrder: number;
      approverType: 'USER' | 'ROLE';
      approverUserId?: string;
      approverRoleId?: string;
      isOptional: boolean;
    }[];
  }[];
};

function toPayload(input: MatrixFormData): CreatePayload {
  return {
    name: input.name,
    description: input.description?.trim() ? input.description : null,
    paymentTypeCode: input.paymentTypeCode,
    effectiveFrom: input.effectiveFrom,
    bands: input.bands.map((b) => ({
      currencyCode: b.currencyCode,
      minAmountMinor: Number(b.minAmountMinor),
      maxAmountMinor:
        b.maxAmountMinor === null || b.maxAmountMinor === undefined
          ? null
          : Number(b.maxAmountMinor),
      sortOrder: b.sortOrder ?? 0,
      steps: b.steps.map((s, i) => ({
        stepOrder: i + 1,
        approverType: s.approverType,
        approverUserId:
          s.approverType === 'USER' && s.approverUserId ? s.approverUserId : undefined,
        approverRoleId:
          s.approverType === 'ROLE' && s.approverRoleId ? s.approverRoleId : undefined,
        isOptional: !!s.isOptional,
      })),
    })),
  };
}

export default function ApprovalMatricesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalMatrixStatus | ''>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalMatrix | null>(null);
  const [viewing, setViewing] = useState<ApprovalMatrix | null>(null);
  const [deleting, setDeleting] = useState<ApprovalMatrix | null>(null);
  const [publishing, setPublishing] = useState<ApprovalMatrix | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (statusFilter) u.set('status', statusFilter);
    if (paymentTypeFilter) u.set('paymentTypeCode', paymentTypeFilter);
    return u.toString();
  }, [page, search, statusFilter, paymentTypeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<ApprovalMatrix>>(`/approval-matrices?${params}`),
  });

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types-all'],
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?page=1&limit=100'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const { data: users } = useQuery({
    queryKey: ['users-all-min'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=100'),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });

  // Editing / viewing the full matrix needs the full bands+steps tree.
  const detailId = editing?.id ?? viewing?.id;
  const { data: detail } = useQuery({
    queryKey: [KEY, 'detail', detailId],
    queryFn: () => api.get<ApprovalMatrix>(`/approval-matrices/${detailId}`),
    enabled: !!detailId,
  });

  const createMutation = useMutation({
    mutationFn: (input: MatrixFormData) =>
      api.post<ApprovalMatrix>('/approval-matrices', toPayload(input)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Draft matrix created', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Create failed', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MatrixFormData }) => {
      const { paymentTypeCode: _pt, ...body } = toPayload(input);
      void _pt;
      return api.put<ApprovalMatrix>(`/approval-matrices/${id}`, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      toast({ title: 'Matrix updated', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post<ApprovalMatrix>(`/approval-matrices/${id}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setPublishing(null);
      toast({
        title: 'Matrix published',
        description: 'In-flight requests retain their original chain.',
        variant: 'success',
      });
    },
    onError: (err: Error) =>
      toast({ title: 'Publish failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/approval-matrices/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      toast({ title: 'Matrix deleted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const paymentTypeOpts = paymentTypes?.data ?? [];
  const currencyOpts = currencies?.data ?? [];
  const userOpts = users?.data ?? [];
  const roleOpts = roles ?? [];

  const allLoaded =
    !!paymentTypes && !!currencies && !!users && !!roles;

  return (
    <div>
      <PageHeader
        title="Approval Matrices"
        description="Per-payment-type, currency-native bands mapped to a sequential approver chain. Versioned with effective dates; changes don't affect in-flight requests (SOW §1.5)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New matrix
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Create draft approval matrix</DialogTitle>
              </DialogHeader>
              {allLoaded && (
                <ApprovalMatrixForm
                  paymentTypes={paymentTypeOpts}
                  currencies={currencyOpts}
                  users={userOpts}
                  roles={roleOpts}
                  submitting={createMutation.isPending}
                  onSubmit={(d) => createMutation.mutate(d)}
                />
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or payment type"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="max-w-sm"
            />
          </div>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={paymentTypeFilter}
            onChange={(e) => {
              setPage(1);
              setPaymentTypeFilter(e.target.value);
            }}
          >
            <option value="">All payment types</option>
            {paymentTypeOpts
              .filter((p) => p.requiresApprovalChain)
              .map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as ApprovalMatrixStatus | '');
            }}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SUPERSEDED">Superseded</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
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
              data.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {m.paymentTypeCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>v{m.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.effectiveFrom}
                    {m.effectiveTo ? ` → ${m.effectiveTo}` : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="View"
                      onClick={() => setViewing(m)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit (draft only)"
                      disabled={m.status !== 'DRAFT'}
                      onClick={() => setEditing(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Publish"
                      disabled={m.status !== 'DRAFT'}
                      onClick={() => setPublishing(m)}
                    >
                      <Send className="h-4 w-4 text-green-700" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={m.status === 'PUBLISHED'}
                      title={
                        m.status === 'PUBLISHED'
                          ? 'Published matrices cannot be deleted'
                          : 'Delete'
                      }
                      onClick={() => setDeleting(m)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No matrices yet.
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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit draft matrix</DialogTitle>
          </DialogHeader>
          {editing && detail && allLoaded && (
            <ApprovalMatrixForm
              defaultValues={detail}
              paymentTypes={paymentTypeOpts}
              currencies={currencyOpts}
              users={userOpts}
              roles={roleOpts}
              paymentTypeLocked
              submitting={updateMutation.isPending}
              onSubmit={(d) => updateMutation.mutate({ id: editing.id, input: d })}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.name} <span className="text-sm text-muted-foreground">v{viewing?.version}</span>
            </DialogTitle>
          </DialogHeader>
          {viewing && detail && allLoaded && (
            <ApprovalMatrixForm
              defaultValues={detail}
              paymentTypes={paymentTypeOpts}
              currencies={currencyOpts}
              users={userOpts}
              roles={roleOpts}
              paymentTypeLocked
              readOnly
              onSubmit={() => undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!publishing} onOpenChange={(o) => !o && setPublishing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish &quot;{publishing?.name}&quot;?</DialogTitle>
            <DialogDescription>
              Publishing makes this matrix the active routing rule for new
              requests from {publishing?.effectiveFrom}. The previously
              published version (if any) will be superseded. Requests already
              in flight keep their original chain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => publishing && publishMutation.mutate(publishing.id)}
              disabled={publishMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {publishMutation.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete matrix "${deleting?.name}"?`}
        description="Soft-deletes the matrix. Published matrices cannot be deleted; supersede them instead."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalMatrixStatus }): React.ReactElement {
  const tones: Record<ApprovalMatrixStatus, string> = {
    DRAFT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    PUBLISHED: 'bg-green-500/10 text-green-700 dark:text-green-400',
    SUPERSEDED: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${tones[status]}`}>
      {status}
    </span>
  );
}
