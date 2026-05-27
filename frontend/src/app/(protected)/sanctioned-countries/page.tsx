'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Paginated, SanctionedCountry } from '@/types/domain';
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

const KEY = 'sanctioned-countries';
const TOKEN_KEY = 'pcs.token';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface CreatePayload {
  countryCode: string;
  countryName: string;
  reason: string;
  isActive: boolean;
}

interface UpdatePayload {
  countryName?: string;
  isActive?: boolean;
  reason: string;
}

// The shared `api` helper has no body-bearing DELETE; the SOW (§1.6) requires
// a reason on every removal, so call DELETE with a JSON body directly.
async function deleteSanctionedCountry(id: string, reason: string): Promise<void> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch(`${API_URL}/sanctioned-countries/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = res.statusText || 'Delete failed';
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (parsed.message) {
        msg = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
}

export default function SanctionedCountriesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SanctionedCountry | null>(null);
  const [deleting, setDeleting] = useState<SanctionedCountry | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (activeFilter) u.set('isActive', activeFilter);
    return u.toString();
  }, [page, search, activeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      api.get<Paginated<SanctionedCountry>>(`/sanctioned-countries?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePayload) =>
      api.post<SanctionedCountry>('/sanctioned-countries', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Country added to sanctions list');
    },
    onError: (err: Error) =>
      notify.error('Add failed', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayload }) =>
      api.put<SanctionedCountry>(`/sanctioned-countries/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      notify.success('Sanctioned country updated');
    },
    onError: (err: Error) =>
      notify.error('Update failed', err),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      deleteSanctionedCountry(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      notify.success('Country removed from sanctions list');
    },
    onError: (err: Error) =>
      notify.error('Remove failed', err),
  });

  return (
    <div>
      <PageHeader
        title="Sanctioned Countries"
        description="Master list of sanctioned country codes used to screen beneficiaries (§6.5). Every add, update, and removal is logged with the acting user, timestamp, and reason."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add country
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add sanctioned country</DialogTitle>
                <DialogDescription>
                  Country code must be an ISO 3166-1 alpha-2 value. The reason
                  is mandatory and is recorded in the audit log.
                </DialogDescription>
              </DialogHeader>
              <CreateForm
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
              placeholder="Search by country name or code"
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
              <TableHead className="w-24">Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((sc) => (
                <TableRow key={sc.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {sc.countryCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{sc.countryName}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {sc.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        sc.isActive
                          ? 'inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400'
                          : 'inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium'
                      }
                    >
                      {sc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(sc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleting(sc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  No sanctioned countries yet.
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
            <DialogTitle>Edit sanctioned country</DialogTitle>
            <DialogDescription>
              Country code cannot be changed. A reason is mandatory and is
              recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <EditForm
              defaultValues={editing}
              submitting={updateMutation.isPending}
              onSubmit={(d) =>
                updateMutation.mutate({ id: editing.id, input: d })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove {deleting?.countryName} from sanctions list?
            </DialogTitle>
            <DialogDescription>
              The entry is soft-deleted and remains in the audit history. A
              reason is required.
            </DialogDescription>
          </DialogHeader>
          {deleting && (
            <RemoveForm
              loading={removeMutation.isPending}
              onConfirm={(reason) =>
                removeMutation.mutate({ id: deleting.id, reason })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (data: CreatePayload) => void;
}): React.ReactElement {
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          countryCode: countryCode.trim().toUpperCase(),
          countryName: countryName.trim(),
          reason: reason.trim(),
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Label htmlFor="countryCode">Code (ISO α-2)</Label>
          <Input
            id="countryCode"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="IR"
            required
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="countryName">Country name</Label>
          <Input
            id="countryName"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
            placeholder="Iran, Islamic Republic of"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. OFAC comprehensive sanctions; UN Security Council resolutions."
          rows={3}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add country'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  defaultValues,
  submitting,
  onSubmit,
}: {
  defaultValues: SanctionedCountry;
  submitting: boolean;
  onSubmit: (data: UpdatePayload) => void;
}): React.ReactElement {
  const [countryName, setCountryName] = useState(defaultValues.countryName);
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(defaultValues.isActive);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          countryName: countryName.trim(),
          isActive,
          reason: reason.trim(),
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Label>Code</Label>
          <Input value={defaultValues.countryCode} disabled />
        </div>
        <div className="col-span-2">
          <Label htmlFor="countryName">Country name</Label>
          <Input
            id="countryName"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reason">Reason for this change</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Updated to reflect EU regulation 2026/123."
          rows={3}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActiveEdit"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="isActiveEdit" className="cursor-pointer">
          Active
        </Label>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RemoveForm({
  loading,
  onConfirm,
}: {
  loading: boolean;
  onConfirm: (reason: string) => void;
}): React.ReactElement {
  const [reason, setReason] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onConfirm(reason.trim());
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="removeReason">Reason for removal</Label>
        <Textarea
          id="removeReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Removed from OFAC SDN list effective 2026-05-20."
          rows={3}
          required
        />
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={loading}>
          {loading ? 'Removing…' : 'Remove'}
        </Button>
      </DialogFooter>
    </form>
  );
}
