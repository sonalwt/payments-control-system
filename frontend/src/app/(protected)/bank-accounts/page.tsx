'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  Bank,
  BalanceChange,
  BankAccount,
  BankAccountType,
  Currency,
  LegalEntity,
  Paginated,
} from '@/types/domain';
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
import { useToast } from '@/components/ui/toast';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const KEY = 'bank-accounts';

const TYPE_OPTIONS: { label: string; value: BankAccountType }[] = [
  { label: 'Current', value: 'CURRENT' },
  { label: 'Collateral', value: 'COLLATERAL' },
  { label: 'Deposit', value: 'DEPOSIT' },
];

const TYPE_STYLES: Record<BankAccountType, string> = {
  CURRENT: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  COLLATERAL: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  DEPOSIT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

interface CreatePayload {
  nickname: string;
  legalEntityId: string;
  bankId: string;
  currencyId: string;
  accountNumber: string;
  iban?: string;
  accountType: BankAccountType;
  branchName?: string;
  branchCode?: string;
  openingBalance?: string;
  minimumBalance?: string;
  isChairmanDesignated?: boolean;
  isActive?: boolean;
}

interface UpdatePayload {
  nickname?: string;
  iban?: string;
  branchName?: string;
  branchCode?: string;
  minimumBalance?: string;
  isChairmanDesignated?: boolean;
  isActive?: boolean;
}

interface OverridePayload {
  newBalance: string;
  reason: string;
}

export default function BankAccountsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | BankAccountType>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);
  const [overriding, setOverriding] = useState<BankAccount | null>(null);
  const [historyFor, setHistoryFor] = useState<BankAccount | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (entityFilter) u.set('legalEntityId', entityFilter);
    if (typeFilter) u.set('accountType', typeFilter);
    if (activeFilter) u.set('isActive', activeFilter);
    return u.toString();
  }, [page, search, entityFilter, typeFilter, activeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<BankAccount>>(`/bank-accounts?${params}`),
  });

  const { data: entities } = useQuery({
    queryKey: ['legal-entities', 'all'],
    queryFn: () =>
      api.get<Paginated<LegalEntity>>(`/legal-entities?page=1&limit=100`),
  });
  const { data: banks } = useQuery({
    queryKey: ['banks', 'all-active'],
    queryFn: () => api.get<Paginated<Bank>>(`/banks?page=1&limit=100&isActive=true`),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies', 'all-active'],
    queryFn: () =>
      api.get<Paginated<Currency>>(`/currencies?page=1&limit=100&isActive=true`),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePayload) =>
      api.post<BankAccount>('/bank-accounts', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Account added', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Add failed', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayload }) =>
      api.put<BankAccount>(`/bank-accounts/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      toast({ title: 'Account updated', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/bank-accounts/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      toast({ title: 'Account deleted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: OverridePayload }) =>
      api.post<BankAccount>(`/bank-accounts/${id}/balance-override`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setOverriding(null);
      toast({ title: 'Balance overridden', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Override failed', description: err.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Bank Accounts"
        description="Group-owned accounts (§2.4). Current accounts fund TT payments; minimum-balance control blocks releases that would breach it (§2.5). Collateral and Deposit accounts are visibility-only."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add bank account</DialogTitle>
                <DialogDescription>
                  Opening balance seeds the running balance; minimum balance
                  is mandatory for CURRENT accounts and disallowed for
                  Collateral / Deposit.
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                entities={entities?.data ?? []}
                banks={banks?.data ?? []}
                currencies={currencies?.data ?? []}
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
              placeholder="Search by nickname, account no., IBAN"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-80"
            />
          </div>
          <Select
            className="w-56"
            options={[
              { label: 'All entities', value: '' },
              ...(entities?.data ?? []).map((e) => ({
                label: e.name,
                value: e.id,
              })),
            ]}
            value={entityFilter}
            onChange={(e) => {
              setPage(1);
              setEntityFilter(e.target.value);
            }}
          />
          <Select
            className="w-40"
            options={[
              { label: 'All types', value: '' },
              ...TYPE_OPTIONS.map((t) => ({ label: t.label, value: t.value })),
            ]}
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value as '' | BankAccountType);
            }}
          />
          <Select
            className="w-36"
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
              <TableHead>Account</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead className="w-24">Currency</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-40 text-right">Balance</TableHead>
              <TableHead className="w-40 text-right">Min balance</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
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
              data.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{a.nickname}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {a.accountNumber}
                      </span>
                      {a.isChairmanDesignated && (
                        <span className="mt-0.5 inline-flex w-fit items-center rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-400">
                          CHAIRMAN
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{a.bank?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.bank?.countryCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {a.currency?.code ?? '—'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLES[a.accountType]}`}
                    >
                      {a.accountType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono tabular-nums">
                      {Number(a.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {a.balanceSource.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {a.accountType === 'CURRENT' && a.minimumBalance
                      ? Number(a.minimumBalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.isActive
                          ? 'inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                          : 'inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium'
                      }
                    >
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Balance history"
                      onClick={() => setHistoryFor(a)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Manual balance override"
                      onClick={() => setOverriding(a)}
                    >
                      <Wallet className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No accounts match the filters.
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit bank account</DialogTitle>
            <DialogDescription>
              Identity fields (entity, bank, currency, account number, type)
              are immutable. Edit descriptive fields and min-balance only.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <EditForm
              account={editing}
              submitting={updateMutation.isPending}
              onSubmit={(d) =>
                updateMutation.mutate({ id: editing.id, input: d })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!overriding}
        onOpenChange={(o) => !o && setOverriding(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual balance override</DialogTitle>
            <DialogDescription>
              §2.5 — Logged with user, timestamp, previous value, new value,
              and reason. Use between reconciliations only.
            </DialogDescription>
          </DialogHeader>
          {overriding && (
            <OverrideForm
              account={overriding}
              submitting={overrideMutation.isPending}
              onSubmit={(d) =>
                overrideMutation.mutate({ id: overriding.id, input: d })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyFor}
        onOpenChange={(o) => !o && setHistoryFor(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Balance movements — {historyFor?.nickname}</DialogTitle>
            <DialogDescription>
              Append-only ledger of every change to the recorded balance (§2.5).
            </DialogDescription>
          </DialogHeader>
          {historyFor && <HistoryTable accountId={historyFor.id} />}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.nickname}?`}
        description="Soft-delete only; the balance history is retained for audit."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function AccountForm({
  entities,
  banks,
  currencies,
  submitting,
  onSubmit,
}: {
  entities: LegalEntity[];
  banks: Bank[];
  currencies: Currency[];
  submitting: boolean;
  onSubmit: (data: CreatePayload) => void;
}): React.ReactElement {
  const [nickname, setNickname] = useState('');
  const [legalEntityId, setLegalEntityId] = useState('');
  const [bankId, setBankId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('CURRENT');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [minimumBalance, setMinimumBalance] = useState('0');
  const [isChairmanDesignated, setChairman] = useState(false);
  const [isActive, setIsActive] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          nickname: nickname.trim(),
          legalEntityId,
          bankId,
          currencyId,
          accountNumber: accountNumber.trim(),
          iban: iban.trim() || undefined,
          accountType,
          branchName: branchName.trim() || undefined,
          branchCode: branchCode.trim() || undefined,
          openingBalance: openingBalance.trim() || '0',
          minimumBalance:
            accountType === 'CURRENT' ? minimumBalance.trim() || '0' : undefined,
          isChairmanDesignated,
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            placeholder="DBS Singapore — Operating"
          />
        </div>
        <div>
          <Label htmlFor="entity">Legal entity</Label>
          <Select
            id="entity"
            options={[
              { label: 'Select…', value: '' },
              ...entities.map((e) => ({ label: e.name, value: e.id })),
            ]}
            value={legalEntityId}
            onChange={(e) => setLegalEntityId(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="bank">Bank</Label>
          <Select
            id="bank"
            options={[
              { label: 'Select…', value: '' },
              ...banks.map((b) => ({
                label: `${b.name} (${b.countryCode})`,
                value: b.id,
              })),
            ]}
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            options={[
              { label: 'Select…', value: '' },
              ...currencies.map((c) => ({
                label: `${c.code} — ${c.name}`,
                value: c.id,
              })),
            ]}
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Account type</Label>
          <Select
            id="type"
            options={TYPE_OPTIONS}
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as BankAccountType)}
            required
          />
        </div>
        <div>
          <Label htmlFor="accountNumber">Account number</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="iban">IBAN</Label>
          <Input
            id="iban"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            maxLength={34}
          />
        </div>
        <div>
          <Label htmlFor="branchName">Branch name</Label>
          <Input
            id="branchName"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="branchCode">Branch code</Label>
          <Input
            id="branchCode"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="opening">Opening balance</Label>
          <Input
            id="opening"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0"
          />
        </div>
        {accountType === 'CURRENT' && (
          <div>
            <Label htmlFor="min">Minimum balance</Label>
            <Input
              id="min"
              value={minimumBalance}
              onChange={(e) => setMinimumBalance(e.target.value)}
              required
              placeholder="0"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            id="chairman"
            type="checkbox"
            checked={isChairmanDesignated}
            onChange={(e) => setChairman(e.target.checked)}
          />
          <Label htmlFor="chairman" className="cursor-pointer">
            Chairman-designated (§9.2)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActiveNewAcct"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <Label htmlFor="isActiveNewAcct" className="cursor-pointer">
            Active
          </Label>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add account'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  account,
  submitting,
  onSubmit,
}: {
  account: BankAccount;
  submitting: boolean;
  onSubmit: (data: UpdatePayload) => void;
}): React.ReactElement {
  const [nickname, setNickname] = useState(account.nickname);
  const [iban, setIban] = useState(account.iban ?? '');
  const [branchName, setBranchName] = useState(account.branchName ?? '');
  const [branchCode, setBranchCode] = useState(account.branchCode ?? '');
  const [minimumBalance, setMinimumBalance] = useState(
    account.minimumBalance ?? '',
  );
  const [isChairmanDesignated, setChairman] = useState(
    account.isChairmanDesignated,
  );
  const [isActive, setIsActive] = useState(account.isActive);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          nickname: nickname.trim(),
          iban: iban.trim() || undefined,
          branchName: branchName.trim() || undefined,
          branchCode: branchCode.trim() || undefined,
          minimumBalance:
            account.accountType === 'CURRENT'
              ? minimumBalance.trim() || '0'
              : undefined,
          isChairmanDesignated,
          isActive,
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="editNickname">Nickname</Label>
        <Input
          id="editNickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="editIban">IBAN</Label>
          <Input
            id="editIban"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            maxLength={34}
          />
        </div>
        <div>
          <Label htmlFor="editBranchName">Branch name</Label>
          <Input
            id="editBranchName"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="editBranchCode">Branch code</Label>
          <Input
            id="editBranchCode"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
          />
        </div>
        {account.accountType === 'CURRENT' && (
          <div>
            <Label htmlFor="editMin">Minimum balance</Label>
            <Input
              id="editMin"
              value={minimumBalance}
              onChange={(e) => setMinimumBalance(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            id="editChairman"
            type="checkbox"
            checked={isChairmanDesignated}
            onChange={(e) => setChairman(e.target.checked)}
          />
          <Label htmlFor="editChairman" className="cursor-pointer">
            Chairman-designated
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="editAcctActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <Label htmlFor="editAcctActive" className="cursor-pointer">Active</Label>
        </div>
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

function OverrideForm({
  account,
  submitting,
  onSubmit,
}: {
  account: BankAccount;
  submitting: boolean;
  onSubmit: (data: OverridePayload) => void;
}): React.ReactElement {
  const [newBalance, setNewBalance] = useState(account.balance);
  const [reason, setReason] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onSubmit({
          newBalance: newBalance.trim(),
          reason: reason.trim(),
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label>Current recorded balance</Label>
        <Input
          value={`${account.currency?.code ?? ''} ${Number(account.balance).toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 4 },
          )}`}
          disabled
        />
      </div>
      <div>
        <Label htmlFor="newBalance">New balance</Label>
        <Input
          id="newBalance"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="overrideReason">Reason</Label>
        <Textarea
          id="overrideReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          placeholder="e.g. Inward wire credited intra-day; bank advice attached out-of-band."
        />
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Override balance'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function HistoryTable({ accountId }: { accountId: string }): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['bank-accounts', accountId, 'history'],
    queryFn: () => api.get<BalanceChange[]>(`/bank-accounts/${accountId}/history`),
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (!data || data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No movements yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-40">When</TableHead>
          <TableHead className="w-32">Kind</TableHead>
          <TableHead className="text-right">Previous</TableHead>
          <TableHead className="text-right">Delta</TableHead>
          <TableHead className="text-right">New</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const delta = Number(row.delta);
          return (
            <TableRow key={row.id}>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(row.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-xs uppercase">
                {row.kind.replace('_', ' ')}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {Number(row.previousBalance).toFixed(2)}
              </TableCell>
              <TableCell
                className={`text-right font-mono tabular-nums ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {Number(row.newBalance).toFixed(2)}
              </TableCell>
              <TableCell className="max-w-md text-sm text-muted-foreground">
                <p className="line-clamp-2">{row.reason ?? '—'}</p>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
