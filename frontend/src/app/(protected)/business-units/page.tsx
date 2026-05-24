'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { BusinessUnit, Country, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const schema = z.object({
  countryId: z.string().uuid(),
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric'),
  description: z.string().max(1000).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

function BUForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<BusinessUnit>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=100'),
  });
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryId: defaultValues?.countryId ?? '',
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      description: defaultValues?.description ?? '',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="countryId">Country</Label>
        <Select id="countryId" placeholder="Select"
          options={(countries?.data ?? []).map((c) => ({ label: `${c.name} (${c.isoCode})`, value: c.id }))}
          {...register('countryId')} />
        {errors.countryId && <p className="text-xs text-destructive">{errors.countryId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function BusinessUnitsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);
  const [deleting, setDeleting] = useState<BusinessUnit | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['business-units', params],
    queryFn: () => api.get<Paginated<BusinessUnit>>(`/business-units?${params}`),
  });
  const createMut = useMutation({
    mutationFn: (i: FormData) => api.post<BusinessUnit>('/business-units', i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['business-units'] }); setCreateOpen(false); toast({ title: 'Created', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: FormData }) => api.put<BusinessUnit>(`/business-units/${id}`, i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['business-units'] }); setEditing(null); toast({ title: 'Updated', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/business-units/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['business-units'] }); setDeleting(null); toast({ title: 'Deleted', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Business Units"
        description="Operating units within each country"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New BU</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create business unit</DialogTitle></DialogHeader>
              <BUForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
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
              <TableHead>Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((bu) => (
              <TableRow key={bu.id}>
                <TableCell className="font-medium">{bu.name}</TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{bu.code}</code></TableCell>
                <TableCell className="text-muted-foreground">{bu.country?.name ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(bu)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(bu)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No business units yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit business unit</DialogTitle></DialogHeader>
          {editing && <BUForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="Fails if departments are still attached."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
