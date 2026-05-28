'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Bank, Country, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const KEY = 'counterparty-banks';
const ENDPOINT = '/counterparty/banks';

const schema = z.object({
  name: z.string().min(2).max(200),
  shortName: z.string().max(50).optional().or(z.literal('')),
  countryId: z.string().uuid('Select a country'),
  swiftBic: z
    .string()
    .regex(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, '8 or 11 uppercase alphanumeric characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function BankForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<Bank>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=200'),
  });
  const countryOptions = (countries?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.code} — ${c.countryName}`, value: c.id }));

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      shortName: defaultValues?.shortName ?? '',
      countryId: defaultValues?.countryId ?? '',
      swiftBic: defaultValues?.swiftBic ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bank name <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="HDFC Bank" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortName">Short name</Label>
          <Input id="shortName" placeholder="HDFC" {...register('shortName')} />
          {errors.shortName && <p className="text-xs text-destructive">{errors.shortName.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="countryId">Country <span className="text-destructive">*</span></Label>
          <Select
            id="countryId"
            placeholder="Select country"
            options={countryOptions}
            {...register('countryId')}
          />
          {errors.countryId && <p className="text-xs text-destructive">{errors.countryId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="swiftBic">SWIFT / BIC</Label>
          <Input
            id="swiftBic"
            placeholder="HDFCINBB"
            maxLength={11}
            style={{ textTransform: 'uppercase' }}
            {...register('swiftBic')}
          />
          {errors.swiftBic && <p className="text-xs text-destructive">{errors.swiftBic.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          {...register('isActive')}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

function normalize(d: FormData) {
  return {
    name: d.name,
    shortName: d.shortName ? d.shortName : undefined,
    countryId: d.countryId,
    swiftBic: d.swiftBic ? d.swiftBic.toUpperCase() : undefined,
    isActive: d.isActive ?? true,
  };
}

export default function CounterpartyBanksPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [deleting, setDeleting] = useState<Bank | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Bank>>(`${ENDPOINT}?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: FormData) => api.post<Bank>(ENDPOINT, normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Counterparty bank created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: FormData }) => api.put<Bank>(`${ENDPOINT}/${id}`, normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`${ENDPOINT}/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Counterparty Banks"
        description="Banks belonging to counterparties (Super Admin & Counterparty roles)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New counterparty bank</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create counterparty bank</DialogTitle></DialogHeader>
              <BankForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, short name or SWIFT" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-md" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank name</TableHead>
              <TableHead>Short name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>SWIFT/BIC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="text-muted-foreground">{b.shortName ?? '—'}</TableCell>
                <TableCell>{b.country ? `${b.country.code} — ${b.country.countryName}` : '—'}</TableCell>
                <TableCell>
                  {b.swiftBic ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{b.swiftBic}</code> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      b.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No counterparty banks yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit counterparty bank</DialogTitle></DialogHeader>
          {editing && <BankForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This will soft-delete the counterparty bank."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
