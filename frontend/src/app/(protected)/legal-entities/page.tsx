'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { LegalEntity, Paginated } from '@/types/domain';
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
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { LegalEntityForm, type LegalEntityFormData } from './legal-entity-form';

const KEY = 'legal-entities';

export default function LegalEntitiesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LegalEntity | null>(null);
  const [deleting, setDeleting] = useState<LegalEntity | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<LegalEntity>>(`/legal-entities?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: LegalEntityFormData) => api.post<LegalEntity>('/legal-entities', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Legal entity created');
    },
    onError: (err: Error) =>
      notify.error('Create failed', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: LegalEntityFormData }) =>
      api.put<LegalEntity>(`/legal-entities/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      notify.success('Updated');
    },
    onError: (err: Error) =>
      notify.error('Update failed', err),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/legal-entities/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      notify.success('Deleted');
    },
    onError: (err: Error) =>
      notify.error('Delete failed', err),
  });

  return (
    <div>
      <PageHeader
        title="Legal Entities"
        description="Registered companies within each group"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New legal entity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create legal entity</DialogTitle>
              </DialogHeader>
              <LegalEntityForm
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
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
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
              data.data.map((le) => (
                <TableRow key={le.id}>
                  <TableCell className="font-medium">{le.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{le.code}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {le.group?.name ?? '—'}
                  </TableCell>
                  <TableCell>{le.registeredCountry}</TableCell>
                  <TableCell>{le.baseCurrency?.code ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(le)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(le)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No legal entities yet.
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit legal entity</DialogTitle>
          </DialogHeader>
          {editing && (
            <LegalEntityForm
              defaultValues={editing}
              submitting={updateMutation.isPending}
              onSubmit={(d) => updateMutation.mutate({ id: editing.id, input: d })}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="Fails if any countries are still attached."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
