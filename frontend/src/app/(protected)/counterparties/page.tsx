'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Counterparty, CounterpartyRole, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { CounterpartyForm, type CounterpartyFormData } from './counterparty-form';

const KEY = 'counterparties';

function normalize(d: CounterpartyFormData) {
  const blank = (v?: string) => (v && v.length > 0 ? v : undefined);
  return {
    code: d.code,
    name: d.name,
    legalName: blank(d.legalName),
    role: d.role,
    countryId: blank(d.countryId),
    taxIdentifiers: (d.taxIdentifiers ?? []).map((t) => ({
      type: t.type,
      value: t.value,
      label: blank(t.label) ?? null,
    })),
    addresses: (d.addresses ?? []).map((a) => ({
      label: a.label,
      line1: a.line1,
      line2: blank(a.line2) ?? null,
      city: a.city,
      state: blank(a.state) ?? null,
      postalCode: blank(a.postalCode) ?? null,
      isPrimary: a.isPrimary,
    })),
    primaryContactName: blank(d.primaryContactName),
    primaryContactEmail: blank(d.primaryContactEmail),
    primaryContactPhone: blank(d.primaryContactPhone),
    notes: blank(d.notes),
    isActive: d.isActive ?? true,
    kycDone: d.kycDone ?? false,
  };
}

const ROLE_STYLES: Record<CounterpartyRole, string> = {
  VENDOR: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800',
  CUSTOMER: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800',
  BOTH: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
};

function Field({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value === '' || value == null ? <span className="text-muted-foreground">—</span> : value}</div>
    </div>
  );
}

function CounterpartyDetails({ cp }: { cp: Counterparty }): React.ReactElement {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Code" value={<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{cp.code}</code>} />
        <Field label="Role" value={<span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[cp.role]}`}>{cp.role}</span>} />
        <Field label="Display name" value={cp.name} />
        <Field label="Legal name" value={cp.legalName} />
        <Field label="Country" value={cp.country ? `${cp.country.code} — ${cp.country.countryName}` : null} />
        <Field label="Status" value={cp.isActive ? 'Active' : 'Inactive'} />
        <Field label="KYC" value={
          <span
            className={
              cp.kycDone
                ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                : 'inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800'
            }
          >
            {cp.kycDone ? 'Done' : 'Pending'}
          </span>
        } />
        <Field label="Contact name" value={cp.primaryContactName} />
        <Field label="Contact email" value={cp.primaryContactEmail} />
        <Field label="Contact phone" value={cp.primaryContactPhone} />
      </div>

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Tax identifiers</div>
        {cp.taxIdentifiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {cp.taxIdentifiers.map((t, i) => (
              <li key={i}>
                <span className="font-medium">{t.type}</span>: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.value}</code>
                {t.label ? <span className="text-muted-foreground ml-2">({t.label})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Addresses</div>
        {cp.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {cp.addresses.map((a, i) => (
              <li key={i} className="rounded border p-2">
                <div className="font-medium flex items-center gap-2">
                  {a.label}
                  {a.isPrimary && <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Primary</span>}
                </div>
                <div className="text-muted-foreground whitespace-pre-line">
                  {[a.line1, a.line2, [a.city, a.state, a.postalCode].filter(Boolean).join(', ')].filter(Boolean).join('\n')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cp.notes && <Field label="Notes" value={<span className="whitespace-pre-wrap">{cp.notes}</span>} />}
    </div>
  );
}

export default function CounterpartiesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | CounterpartyRole>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Counterparty | null>(null);
  const [editing, setEditing] = useState<Counterparty | null>(null);
  const [deleting, setDeleting] = useState<Counterparty | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (roleFilter) u.set('role', roleFilter);
    return u.toString();
  }, [page, search, roleFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Counterparty>>(`/counterparties?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: CounterpartyFormData) => api.post<Counterparty>('/counterparties', normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Counterparty created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: CounterpartyFormData }) => api.put<Counterparty>(`/counterparties/${id}`, normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/counterparties/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Counterparties"
        description="Unified vendor & customer master (SoW §1.3). Each record carries a role, country, tax identifiers, addresses, and primary contact."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New counterparty</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Create counterparty</DialogTitle></DialogHeader>
              <CounterpartyForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or code" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-sm" />
          <Select
            className="w-40"
            options={[
              { label: 'All roles', value: '' },
              { label: 'Vendor', value: 'VENDOR' },
              { label: 'Customer', value: 'CUSTOMER' },
              { label: 'Both', value: 'BOTH' },
            ]}
            value={roleFilter}
            onChange={(e) => { setPage(1); setRoleFilter(e.target.value as '' | CounterpartyRole); }}
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
              <TableHead>KYC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((cp) => (
              <TableRow key={cp.id}>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{cp.code}</code></TableCell>
                <TableCell className="font-medium">
                  <div>{cp.name}</div>
                  {cp.legalName && <div className="text-xs text-muted-foreground">{cp.legalName}</div>}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[cp.role]}`}>{cp.role}</span>
                </TableCell>
                <TableCell>{cp.country ? `${cp.country.code} — ${cp.country.countryName}` : '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cp.taxIdentifiers.length === 0 ? '—' : cp.taxIdentifiers.map((t) => t.type).join(', ')}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      cp.kycDone
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800'
                    }
                  >
                    {cp.kycDone ? 'Done' : 'Pending'}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      cp.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {cp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(cp)} title="View"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(cp)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(cp)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No counterparties yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Counterparty details</DialogTitle></DialogHeader>
          {viewing && <CounterpartyDetails cp={viewing} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit counterparty</DialogTitle></DialogHeader>
          {editing && <CounterpartyForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This will soft-delete the counterparty."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
