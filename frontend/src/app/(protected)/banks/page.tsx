'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Bank, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const KEY = 'banks';

interface CreatePayload {
  name: string;
  shortName?: string;
  countryCode: string;
  swiftBic?: string;
  address?: string;
  isActive: boolean;
}

type UpdatePayload = Partial<CreatePayload>;

export default function BanksPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [deleting, setDeleting] = useState<Bank | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (countryFilter) u.set('countryCode', countryFilter);
    if (activeFilter) u.set('isActive', activeFilter);
    return u.toString();
  }, [page, search, countryFilter, activeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Bank>>(`/banks?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePayload) => api.post<Bank>('/banks', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Bank added');
    },
    onError: (err: Error) =>
      notify.error('Add failed', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayload }) =>
      api.put<Bank>(`/banks/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      notify.success('Bank updated');
    },
    onError: (err: Error) =>
      notify.error('Update failed', err),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/banks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      notify.success('Bank deleted');
    },
    onError: (err: Error) =>
      notify.error('Delete failed', err),
  });

  return (
    <div>
      <PageHeader
        title="Banks"
        description="Banks with which the group holds relationships (§2.3). Identifying codes (SWIFT/BIC) and country are recorded for each."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add bank
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add bank</DialogTitle>
                <DialogDescription>
                  Country must be an ISO 3166-1 alpha-2 code. SWIFT/BIC is
                  validated to 8 or 11 alphanumeric uppercase characters.
                </DialogDescription>
              </DialogHeader>
              <BankForm
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
              placeholder="Search by name or SWIFT/BIC"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-80"
            />
          </div>
          <Input
            placeholder="Country (e.g. SG)"
            value={countryFilter}
            onChange={(e) => {
              setPage(1);
              setCountryFilter(e.target.value.toUpperCase());
            }}
            maxLength={2}
            className="w-32"
          />
          <Select
            className="w-44"
            options={[
              { label: 'All', value: '' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            value={activeFilter}
            onChange={(e) => {
              setPage(1);
              setActiveFilter(e.target.value as '' | 'true' | 'false');
            }}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">Short name</TableHead>
              <TableHead className="w-24">Country</TableHead>
              <TableHead className="w-32">SWIFT/BIC</TableHead>
              <TableHead className="w-24">Status</TableHead>
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
              data.data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.shortName ?? '—'}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {b.countryCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.swiftBic ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={
                        b.isActive
                          ? 'inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                          : 'inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium'
                      }
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(b)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No banks yet.
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
            <DialogTitle>Edit bank</DialogTitle>
          </DialogHeader>
          {editing && (
            <BankForm
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
        title={`Delete ${deleting?.name}?`}
        description="Soft-delete; existing accounts referencing this bank remain."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function BankForm({
  defaultValues,
  submitting,
  onSubmit,
}: {
  defaultValues?: Bank;
  submitting: boolean;
  onSubmit: (data: CreatePayload) => void;
}): React.ReactElement {
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [shortName, setShortName] = useState(defaultValues?.shortName ?? '');
  const [countryCode, setCountryCode] = useState(defaultValues?.countryCode ?? '');
  const [swiftBic, setSwiftBic] = useState(defaultValues?.swiftBic ?? '');
  const [address, setAddress] = useState(defaultValues?.address ?? '');
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name.trim(),
          shortName: shortName.trim() || undefined,
          countryCode: countryCode.trim().toUpperCase(),
          swiftBic: swiftBic.trim() ? swiftBic.trim().toUpperCase() : undefined,
          address: address.trim() || undefined,
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="bankName">Bank name</Label>
        <Input
          id="bankName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="HSBC"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="shortName">Short name</Label>
          <Input
            id="shortName"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="HSBC SG"
          />
        </div>
        <div>
          <Label htmlFor="country">Country (α-2)</Label>
          <Input
            id="country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            maxLength={2}
            required
            placeholder="SG"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="swift">SWIFT / BIC</Label>
        <Input
          id="swift"
          value={swiftBic}
          onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
          maxLength={11}
          placeholder="HSBCSGSG"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActiveBank"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="isActiveBank" className="cursor-pointer">Active</Label>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : defaultValues ? 'Save changes' : 'Add bank'}
        </Button>
      </DialogFooter>
    </form>
  );
}
