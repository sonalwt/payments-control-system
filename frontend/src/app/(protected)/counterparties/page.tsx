'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Counterparty, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import {
  CounterpartyForm,
  type CounterpartyFormData,
} from './counterparty-form';

const KEY = 'counterparties';

export default function CounterpartiesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'' | 'VENDOR' | 'CUSTOMER' | 'BOTH'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Counterparty | null>(null);
  const [deleting, setDeleting] = useState<Counterparty | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (role) u.set('role', role);
    return u.toString();
  }, [page, search, role]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Counterparty>>(`/counterparties?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: CounterpartyFormData) =>
      api.post<Counterparty>('/counterparties', sanitize(input)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Counterparty created');
    },
    onError: (err: Error) =>
      notify.error('Create failed', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CounterpartyFormData }) => {
      const { code: _code, ...rest } = sanitize(input);
      void _code;
      return api.put<Counterparty>(`/counterparties/${id}`, rest);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      notify.success('Counterparty updated');
    },
    onError: (err: Error) =>
      notify.error('Update failed', err),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/counterparties/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      notify.success('Counterparty deleted');
    },
    onError: (err: Error) =>
      notify.error('Delete failed', err),
  });

  return (
    <div>
      <PageHeader
        title="Counterparties"
        description="Unified vendor and customer master. Tax identifiers and addresses are versioned; beneficiary bank accounts are managed under the bank account change control workflow."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New counterparty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create counterparty</DialogTitle>
              </DialogHeader>
              <CounterpartyForm
                submitting={createMutation.isPending}
                onSubmit={(d) => createMutation.mutate(d)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or legal name"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-80"
            />
          </div>
          <Select
            className="w-44"
            options={[
              { label: 'All roles', value: '' },
              { label: 'Vendor', value: 'VENDOR' },
              { label: 'Customer', value: 'CUSTOMER' },
              { label: 'Both', value: 'BOTH' },
            ]}
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value as '' | 'VENDOR' | 'CUSTOMER' | 'BOTH');
            }}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Tax IDs</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {cp.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{cp.name}</div>
                    {cp.legalName && (
                      <div className="text-xs text-muted-foreground">
                        {cp.legalName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={roleTone(cp.role)}>{cp.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{cp.countryCode}</code>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {cp.taxIdentifiers.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      cp.taxIdentifiers.map((t, idx) => (
                        <Badge key={idx}>{t.type}</Badge>
                      ))
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={cp.isActive ? 'green' : 'gray'}>
                      {cp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(cp)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleting(cp)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No counterparties yet.
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
            <DialogTitle>Edit counterparty</DialogTitle>
          </DialogHeader>
          {editing && (
            <CounterpartyForm
              defaultValues={editing}
              codeLocked
              submitting={updateMutation.isPending}
              onSubmit={(d) =>
                updateMutation.mutate({ id: editing.id, input: d })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete counterparty "${deleting?.name}"?`}
        description="Soft-deletes the counterparty. Existing payment history is preserved."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

// Strip empty optional strings so the backend treats them as omitted, not as
// empty-string values that fail `@IsEmail()` etc.
function sanitize(input: CounterpartyFormData): CounterpartyFormData {
  const blank = (s?: string | null): string | null => (s && s.length > 0 ? s : null);
  return {
    ...input,
    legalName: blank(input.legalName) ?? undefined,
    primaryContactName: blank(input.primaryContactName) ?? undefined,
    primaryContactEmail: blank(input.primaryContactEmail) ?? undefined,
    primaryContactPhone: blank(input.primaryContactPhone) ?? undefined,
    notes: blank(input.notes) ?? undefined,
    taxIdentifiers: input.taxIdentifiers.map((t) => ({
      ...t,
      label: blank(t.label) ?? undefined,
    })),
    addresses: input.addresses.map((a) => ({
      ...a,
      line2: blank(a.line2) ?? undefined,
      state: blank(a.state) ?? undefined,
      postalCode: blank(a.postalCode) ?? undefined,
    })),
  } as CounterpartyFormData;
}

type BadgeTone = 'gray' | 'green' | 'amber' | 'blue' | 'purple' | 'red';

function roleTone(role: Counterparty['role']): BadgeTone {
  switch (role) {
    case 'VENDOR':
      return 'amber';
    case 'CUSTOMER':
      return 'blue';
    case 'BOTH':
      return 'purple';
  }
}

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
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
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
