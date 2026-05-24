'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { BusinessUnit, Department, Paginated } from '@/types/domain';
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
  businessUnitId: z.string().uuid(),
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric'),
  description: z.string().max(1000).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

function DeptForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<Department>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { data: bus } = useQuery({
    queryKey: ['bus-all'],
    queryFn: () => api.get<Paginated<BusinessUnit>>('/business-units?page=1&limit=100'),
  });
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessUnitId: defaultValues?.businessUnitId ?? '',
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      description: defaultValues?.description ?? '',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessUnitId">Business unit</Label>
        <Select id="businessUnitId" placeholder="Select"
          options={(bus?.data ?? []).map((b) => ({ label: b.name, value: b.id }))}
          {...register('businessUnitId')} />
        {errors.businessUnitId && <p className="text-xs text-destructive">{errors.businessUnitId.message}</p>}
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

export default function DepartmentsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', params],
    queryFn: () => api.get<Paginated<Department>>(`/departments?${params}`),
  });
  const createMut = useMutation({
    mutationFn: (i: FormData) => api.post<Department>('/departments', i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['departments'] }); setCreateOpen(false); toast({ title: 'Created', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: FormData }) => api.put<Department>(`/departments/${id}`, i),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['departments'] }); setEditing(null); toast({ title: 'Updated', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/departments/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['departments'] }); setDeleting(null); toast({ title: 'Deleted', variant: 'success' }); },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Departments within each business unit"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New department</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create department</DialogTitle></DialogHeader>
              <DeptForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
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
              <TableHead>Business unit</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{d.code}</code></TableCell>
                <TableCell className="text-muted-foreground">{d.businessUnit?.name ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No departments yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit department</DialogTitle></DialogHeader>
          {editing && <DeptForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
