'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AccountType, Bank, BankAccount, Currency, Paginated } from '@/types/domain';
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

const KEY = 'bank-accounts';

const schema = z.object({
  bankId: z.string().uuid('Select a bank'),
  bankNickname: z.string().max(100).optional().or(z.literal('')),
  currencyId: z.string().uuid('Select a currency'),
  accountTypeId: z.string().uuid('Select an account type'),
  accountNumber: z.string().min(1).max(50),
  branchName: z.string().max(120).optional().or(z.literal('')),
  branchCode: z.string().max(30).optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0).optional(),
  minimumBalance: z.coerce.number().min(0).optional(),
  isChairmanDesignated: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function BankAccountForm({
  defaultValues, onSubmit, submitting,
}: {
  defaultValues?: Partial<BankAccount>;
  onSubmit: (d: FormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { data: banks } = useQuery({
    queryKey: ['banks-all'],
    queryFn: () => api.get<Paginated<Bank>>('/banks?page=1&limit=200'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const { data: accountTypes } = useQuery({
    queryKey: ['account-types-all'],
    queryFn: () => api.get<Paginated<AccountType>>('/account-types?page=1&limit=200'),
  });

  const bankOptions = (banks?.data ?? [])
    .filter((b) => b.isActive)
    .map((b) => ({ label: b.shortName ? `${b.name} (${b.shortName})` : b.name, value: b.id }));
  const currencyOptions = (currencies?.data ?? []).map((c) => ({
    label: c.code ? `${c.code} — ${c.name}` : c.name,
    value: c.id,
  }));
  const accountTypeOptions = (accountTypes?.data ?? [])
    .filter((at) => at.isActive)
    .map((at) => ({ label: at.name, value: at.id }));

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankId: defaultValues?.bankId ?? '',
      bankNickname: defaultValues?.bankNickname ?? '',
      currencyId: defaultValues?.currencyId ?? '',
      accountTypeId: defaultValues?.accountTypeId ?? '',
      accountNumber: defaultValues?.accountNumber ?? '',
      branchName: defaultValues?.branchName ?? '',
      branchCode: defaultValues?.branchCode ?? '',
      openingBalance:
        defaultValues?.openingBalance != null
          ? Number(defaultValues.openingBalance)
          : undefined,
      minimumBalance:
        defaultValues?.minimumBalance != null
          ? Number(defaultValues.minimumBalance)
          : undefined,
      isChairmanDesignated: defaultValues?.isChairmanDesignated ?? false,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bankId">Bank name <span className="text-destructive">*</span></Label>
          <Select
            id="bankId"
            placeholder="Select bank"
            options={bankOptions}
            {...register('bankId')}
          />
          {errors.bankId && <p className="text-xs text-destructive">{errors.bankId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankNickname">Bank nickname</Label>
          <Input id="bankNickname" placeholder="HDFC – Main Operating" {...register('bankNickname')} />
          {errors.bankNickname && <p className="text-xs text-destructive">{errors.bankNickname.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currencyId">Currency <span className="text-destructive">*</span></Label>
          <Select
            id="currencyId"
            placeholder="Select currency"
            options={currencyOptions}
            {...register('currencyId')}
          />
          {errors.currencyId && <p className="text-xs text-destructive">{errors.currencyId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountTypeId">Account type <span className="text-destructive">*</span></Label>
          <Select
            id="accountTypeId"
            placeholder="Select account type"
            options={accountTypeOptions}
            {...register('accountTypeId')}
          />
          {errors.accountTypeId && <p className="text-xs text-destructive">{errors.accountTypeId.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2 col-span-3">
          <Label htmlFor="accountNumber">Account number <span className="text-destructive">*</span></Label>
          <Input id="accountNumber" placeholder="50100123456789" {...register('accountNumber')} />
          {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branchName">Branch name</Label>
          <Input id="branchName" {...register('branchName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branchCode">Branch code</Label>
          <Input id="branchCode" {...register('branchCode')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openingBalance">Opening balance</Label>
          <Input id="openingBalance" type="number" step="0.0001" min={0} {...register('openingBalance')} />
          {errors.openingBalance && <p className="text-xs text-destructive">{errors.openingBalance.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumBalance">Minimum balance</Label>
          <Input id="minimumBalance" type="number" step="0.0001" min={0} {...register('minimumBalance')} />
          {errors.minimumBalance && <p className="text-xs text-destructive">{errors.minimumBalance.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isChairmanDesignated"
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          {...register('isChairmanDesignated')}
        />
        <Label htmlFor="isChairmanDesignated">Chairman-designated account</Label>
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
    bankId: d.bankId,
    bankNickname: d.bankNickname ? d.bankNickname : undefined,
    currencyId: d.currencyId,
    accountTypeId: d.accountTypeId,
    accountNumber: d.accountNumber,
    branchName: d.branchName ? d.branchName : undefined,
    branchCode: d.branchCode ? d.branchCode : undefined,
    openingBalance: d.openingBalance,
    minimumBalance: d.minimumBalance,
    isChairmanDesignated: d.isChairmanDesignated ?? false,
    isActive: d.isActive ?? true,
  };
}

export default function BankAccountsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<BankAccount>>(`/bank-accounts?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: FormData) => api.post<BankAccount>('/bank-accounts', normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Bank account created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: FormData }) => api.put<BankAccount>(`/bank-accounts/${id}`, normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/bank-accounts/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Bank Accounts"
        description="Master list of bank accounts (Super Admin only)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New bank account</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Create bank account</DialogTitle></DialogHeader>
              <BankAccountForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by bank, nickname or account number" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-md" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank / Nickname</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead>Chairman</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-medium">{a.bank?.name ?? a.bankName ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{a.bankNickname ?? '—'}</div>
                </TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.accountNumber}</code></TableCell>
                <TableCell className="text-muted-foreground">{a.accountTypeMaster?.name ?? '—'}</TableCell>
                <TableCell>{a.currency?.code ?? a.currency?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.branchName ?? '—'}
                  {a.branchCode ? <span className="ml-1 text-xs">({a.branchCode})</span> : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.openingBalance != null ? Number(a.openingBalance).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.minimumBalance != null ? Number(a.minimumBalance).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {a.isChairmanDesignated ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800">
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      a.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No bank accounts yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit bank account</DialogTitle></DialogHeader>
          {editing && <BankAccountForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.bankNickname ?? deleting?.bankName ?? deleting?.accountNumber}"?`}
        description="This will soft-delete the bank account."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
