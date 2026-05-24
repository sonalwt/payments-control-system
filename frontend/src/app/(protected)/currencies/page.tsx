'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Currency, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
import { useToast } from '@/components/ui/toast';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const KEY = 'currencies';

interface CreatePayload {
  code: string;
  name: string;
  numericCode?: string;
  minorUnit?: number;
  symbol?: string;
  isActive: boolean;
}

interface UpdatePayload {
  name?: string;
  numericCode?: string;
  minorUnit?: number;
  symbol?: string;
  isActive?: boolean;
}

export default function CurrenciesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState<Currency | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) u.set('search', search);
    if (activeFilter) u.set('isActive', activeFilter);
    return u.toString();
  }, [page, search, activeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Currency>>(`/currencies?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePayload) =>
      api.post<Currency>('/currencies', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Currency added', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Add failed', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayload }) =>
      api.put<Currency>(`/currencies/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      toast({ title: 'Currency updated', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/currencies/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      toast({ title: 'Currency deleted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Currencies"
        description="ISO 4217 currency master (§2.1). USD is the group reporting currency; approval thresholds are defined in native currency and not subject to FX conversion."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add currency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add currency</DialogTitle>
                <DialogDescription>
                  ISO 4217 alpha-3 code (3 uppercase letters). Minor unit
                  defaults to 2 (use 0 for JPY, KRW, etc.).
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
              placeholder="Search by code or name"
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
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Numeric</TableHead>
              <TableHead className="w-20 text-right">Minor</TableHead>
              <TableHead className="w-20">Symbol</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24">Origin</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {c.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.numericCode ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.minorUnit}</TableCell>
                  <TableCell>{c.symbol ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={
                        c.isActive
                          ? 'inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                          : 'inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium'
                      }
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.isSystem ? (
                      <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                        System
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Custom</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={c.isSystem}
                      title={c.isSystem ? 'System currency — deactivate instead' : 'Delete'}
                      onClick={() => !c.isSystem && setDeleting(c)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No currencies match the filters.
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
            <DialogTitle>Edit currency</DialogTitle>
            <DialogDescription>
              Code is the natural key and cannot be changed.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <EditForm
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
        title={`Delete ${deleting?.code}?`}
        description="This is a soft delete; the entry stays in the audit history."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
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
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [numericCode, setNumericCode] = useState('');
  const [minorUnit, setMinorUnit] = useState(2);
  const [symbol, setSymbol] = useState('');
  const [isActive, setIsActive] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          numericCode: numericCode.trim() || undefined,
          minorUnit,
          symbol: symbol.trim() || undefined,
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="code">Code (α-3)</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={3}
            required
            placeholder="AUD"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Australian Dollar" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="numericCode">Numeric (ISO)</Label>
          <Input
            id="numericCode"
            value={numericCode}
            onChange={(e) => setNumericCode(e.target.value)}
            maxLength={3}
            placeholder="036"
          />
        </div>
        <div>
          <Label htmlFor="minorUnit">Minor unit</Label>
          <Input
            id="minorUnit"
            type="number"
            min={0}
            max={4}
            value={minorUnit}
            onChange={(e) => setMinorUnit(parseInt(e.target.value || '0', 10))}
          />
        </div>
        <div>
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            maxLength={8}
            placeholder="A$"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActiveNew"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="isActiveNew" className="cursor-pointer">Active</Label>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add currency'}
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
  defaultValues: Currency;
  submitting: boolean;
  onSubmit: (data: UpdatePayload) => void;
}): React.ReactElement {
  const [name, setName] = useState(defaultValues.name);
  const [numericCode, setNumericCode] = useState(defaultValues.numericCode ?? '');
  const [minorUnit, setMinorUnit] = useState(defaultValues.minorUnit);
  const [symbol, setSymbol] = useState(defaultValues.symbol ?? '');
  const [isActive, setIsActive] = useState(defaultValues.isActive);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name.trim(),
          numericCode: numericCode.trim() || undefined,
          minorUnit,
          symbol: symbol.trim() || undefined,
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Code</Label>
          <Input value={defaultValues.code} disabled />
        </div>
        <div className="col-span-2">
          <Label htmlFor="editName">Name</Label>
          <Input id="editName" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="editNumeric">Numeric</Label>
          <Input
            id="editNumeric"
            value={numericCode}
            onChange={(e) => setNumericCode(e.target.value)}
            maxLength={3}
          />
        </div>
        <div>
          <Label htmlFor="editMinor">Minor unit</Label>
          <Input
            id="editMinor"
            type="number"
            min={0}
            max={4}
            value={minorUnit}
            onChange={(e) => setMinorUnit(parseInt(e.target.value || '0', 10))}
          />
        </div>
        <div>
          <Label htmlFor="editSymbol">Symbol</Label>
          <Input
            id="editSymbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            maxLength={8}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActiveEdit"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="isActiveEdit" className="cursor-pointer">Active</Label>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}
