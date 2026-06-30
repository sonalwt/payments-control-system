'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Country, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ImportCsvDialog } from '@/components/shared/import-csv-dialog';

const schema = z.object({
  countryName: z.string().min(2).max(120),
  countryShortName: z.string().min(1).max(20),
  code: z.string().min(2).max(10),
  isActive: z.boolean().optional(),
  isSanctioned: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function CountryForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<Country>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryName: defaultValues?.countryName ?? '',
      countryShortName: defaultValues?.countryShortName ?? '',
      code: defaultValues?.code ?? '',
      isActive: defaultValues?.isActive ?? true,
      isSanctioned: defaultValues?.isSanctioned ?? false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="countryName">Country name <span className="text-destructive">*</span></Label>
          <Input id="countryName" placeholder="India" {...register('countryName')} />
          {errors.countryName && <p className="text-xs text-destructive">{errors.countryName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryShortName">Short name <span className="text-destructive">*</span></Label>
          <Input id="countryShortName" placeholder="IND" {...register('countryShortName')} />
          {errors.countryShortName && <p className="text-xs text-destructive">{errors.countryShortName.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
        <Input id="code" maxLength={10} placeholder="IN" {...register('code')} />
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            {...register('isActive')}
          />
          <span className="text-sm">Active</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            {...register('isSanctioned')}
          />
          <span className="text-sm">Sanctioned country?</span>
        </label>
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
        description="Master list of countries (Super Admin only)."
        actions={
          <div className="flex items-center gap-2">
            <ImportCsvDialog
              entityName="Countries"
              endpoint="/countries/import"
              sampleHeaders={['country_name', 'country_short_name', 'code', 'is_active', 'is_sanctioned']}
              sampleRows={[['United Kingdom', 'UK', 'GB', 'true', 'false'], ['Germany', 'DE', 'DE', 'true', 'false']]}
              onSuccess={() => void qc.invalidateQueries({ queryKey: ['countries'] })}
            />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New country</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create country</DialogTitle></DialogHeader>
                <CountryForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
              </DialogContent>
            </Dialog>
          </div>
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
              <TableHead>Country name</TableHead>
              <TableHead>Short name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Sanctioned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.countryName}</TableCell>
                <TableCell className="text-muted-foreground">{c.countryShortName}</TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.code}</code></TableCell>
                <TableCell>
                  {c.isSanctioned ? (
                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800">
                      Sanctioned
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      c.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No countries yet.</TableCell></TableRow>
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
        title={`Delete "${deleting?.countryName}"?`}
        description="This will soft-delete the country."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
