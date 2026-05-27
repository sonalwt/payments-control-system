'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Country, LegalEntity, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const schema = z.object({
  legalEntityId: z.string().uuid(),
  name: z.string().min(2).max(120),
  isoCode: z.string().regex(/^[A-Z]{2}$/, 'ISO alpha-2'),
});
type FormData = z.infer<typeof schema>;

function CountryForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<Country>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { data: les } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=100'),
  });
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalEntityId: defaultValues?.legalEntityId ?? '',
      name: defaultValues?.name ?? '',
      isoCode: defaultValues?.isoCode ?? '',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="legalEntityId">Legal entity</Label>
        <Select
          id="legalEntityId"
          placeholder="Select"
          options={(les?.data ?? []).map((l) => ({ label: l.name, value: l.id }))}
          {...register('legalEntityId')}
        />
        {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="isoCode">ISO code</Label>
          <Input id="isoCode" maxLength={2} placeholder="IN" {...register('isoCode')} />
          {errors.isoCode && <p className="text-xs text-destructive">{errors.isoCode.message}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function CountriesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState<Country | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();
  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['countries', params],
    queryFn: () => api.get<Paginated<Country>>(`/countries?${params}`),
  });
  const createMut = useMutation({
    mutationFn: (i: FormData) => api.post<Country>('/countries', i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['countries'] }); setCreateOpen(false); notify.success('Created'); },
    onError: (e: Error) => notify.error('Failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: FormData }) => api.put<Country>(`/countries/${id}`, i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['countries'] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/countries/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['countries'] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Countries"
        description="Operating countries within each legal entity"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New country</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create country</DialogTitle></DialogHeader>
              <CountryForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ISO</TableHead>
              <TableHead>Legal entity</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.isoCode}</code></TableCell>
                <TableCell className="text-muted-foreground">{c.legalEntity?.name ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No countries yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit country</DialogTitle></DialogHeader>
          {editing && <CountryForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="Fails if business units are attached."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
