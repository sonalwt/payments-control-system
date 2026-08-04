'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AccountType, Bank, BankAccount, Currency, LegalEntity, Paginated } from '@/types/domain';
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

const chargeBandSchema = z.object({
  minAmount: z.coerce.number().min(0),
  maxAmount: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  percentage: z.coerce.number().min(0).max(100),
});

const schema = z.object({
  bankId: z.string().uuid('Select a bank'),
  legalEntityId: z.string().uuid('Select a legal entity').optional().or(z.literal('')),
  currencyId: z.string().uuid('Select a currency'),
  accountTypeId: z.string().uuid('Select an account type'),
  accountNumber: z.string().min(1).max(50),
  branchName: z.string().max(120).optional().or(z.literal('')),
  branchCode: z.string().max(30).optional().or(z.literal('')),
  accountHolderName: z.string().max(200).optional().or(z.literal('')),
  swiftBic: z.string().max(20).optional().or(z.literal('')),
  iban: z.string().max(60).optional().or(z.literal('')),
  abaNumber: z.string().max(40).optional().or(z.literal('')),
  bankCode: z.string().max(50).optional().or(z.literal('')),
  sortCode: z.string().max(150).optional().or(z.literal('')),
  customerId: z.string().max(60).optional().or(z.literal('')),
  bankAddress: z.string().optional().or(z.literal('')),
  correspondentBank: z.string().optional().or(z.literal('')),
  correspondentSwift: z.string().max(100).optional().or(z.literal('')),
  contactName: z.string().max(150).optional().or(z.literal('')),
  contactPhone: z.string().max(60).optional().or(z.literal('')),
  contactPhoneAlt: z.string().max(60).optional().or(z.literal('')),
  contactEmail: z.string().max(150).optional().or(z.literal('')),
  fax: z.string().max(80).optional().or(z.literal('')),
  authSignatory: z.string().max(200).optional().or(z.literal('')),
  registeredEmail: z.string().max(150).optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0).optional(),
  minimumBalance: z.coerce.number().min(0).optional(),
  remainingBalance: z.coerce.number().min(0).optional(),
  isChairmanDesignated: z.boolean().optional(),
  isActive: z.boolean().optional(),
  chargeBands: z.array(chargeBandSchema).optional().default([]),
}).superRefine((d, ctx) => {
  const open = (d.chargeBands ?? []).filter((b) => b.maxAmount === '' || b.maxAmount == null);
  if (open.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['chargeBands'], message: 'Only one open-ended band (blank max) is allowed' });
  }
  (d.chargeBands ?? []).forEach((b, i) => {
    if (b.maxAmount !== '' && b.maxAmount != null && Number(b.maxAmount) <= Number(b.minAmount)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['chargeBands', i, 'maxAmount'], message: 'Max must be greater than min' });
    }
  });
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
  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
  });

  const legalEntityOptions = (legalEntities?.data ?? [])
    .filter((le) => le.isActive)
    .map((le) => ({ label: `${le.code} — ${le.name}`, value: le.id }));
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

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankId: defaultValues?.bankId ?? '',
      legalEntityId: defaultValues?.legalEntityId ?? '',
      currencyId: defaultValues?.currencyId ?? '',
      accountTypeId: defaultValues?.accountTypeId ?? '',
      accountNumber: defaultValues?.accountNumber ?? '',
      branchName: defaultValues?.branchName ?? '',
      branchCode: defaultValues?.branchCode ?? '',
      accountHolderName: defaultValues?.accountHolderName ?? '',
      swiftBic: defaultValues?.swiftBic ?? '',
      iban: defaultValues?.iban ?? '',
      abaNumber: defaultValues?.abaNumber ?? '',
      bankCode: defaultValues?.bankCode ?? '',
      sortCode: defaultValues?.sortCode ?? '',
      customerId: defaultValues?.customerId ?? '',
      bankAddress: defaultValues?.bankAddress ?? '',
      correspondentBank: defaultValues?.correspondentBank ?? '',
      correspondentSwift: defaultValues?.correspondentSwift ?? '',
      contactName: defaultValues?.contactName ?? '',
      contactPhone: defaultValues?.contactPhone ?? '',
      contactPhoneAlt: defaultValues?.contactPhoneAlt ?? '',
      contactEmail: defaultValues?.contactEmail ?? '',
      fax: defaultValues?.fax ?? '',
      authSignatory: defaultValues?.authSignatory ?? '',
      registeredEmail: defaultValues?.registeredEmail ?? '',
      openingBalance:
        defaultValues?.openingBalance != null
          ? Number(defaultValues.openingBalance)
          : undefined,
      minimumBalance:
        defaultValues?.minimumBalance != null
          ? Number(defaultValues.minimumBalance)
          : undefined,
      remainingBalance:
        defaultValues?.remainingBalance != null
          ? Number(defaultValues.remainingBalance)
          : undefined,
      isChairmanDesignated: defaultValues?.isChairmanDesignated ?? false,
      isActive: defaultValues?.isActive ?? true,
      chargeBands: (defaultValues?.chargeBands ?? []).map((b) => ({
        minAmount: Number(b.minAmount),
        maxAmount: b.maxAmount == null ? '' : Number(b.maxAmount),
        percentage: Number(b.percentage),
      })),
    },
  });

  const bands = useFieldArray({ control, name: 'chargeBands' });

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
          <Label htmlFor="legalEntityId">Legal entity (account name)</Label>
          <Select
            id="legalEntityId"
            placeholder="Select legal entity"
            options={legalEntityOptions}
            {...register('legalEntityId')}
          />
          {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
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
          <Label htmlFor="accountHolderName">Account holder name</Label>
          <Input id="accountHolderName" placeholder="As printed by the bank" {...register('accountHolderName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="authSignatory">Authorised signatory</Label>
          <Input id="authSignatory" {...register('authSignatory')} />
        </div>
      </div>

      {/* Clearing identifiers — which ones apply depends on the jurisdiction. */}
      <div className="space-y-4 rounded-md border p-3">
        <div>
          <Label className="text-sm">Bank &amp; clearing details</Label>
          <p className="text-xs text-muted-foreground">
            SWIFT/IBAN plus the local clearing identifiers. Leave blank the ones your bank does not use.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="swiftBic">SWIFT / BIC</Label>
            <Input id="swiftBic" placeholder="HSBCSGSG" {...register('swiftBic')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" placeholder="GB82UBIN23562602310009" {...register('iban')} />
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
            <Label htmlFor="bankCode">Bank code</Label>
            <Input id="bankCode" {...register('bankCode')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortCode">Sort code</Label>
            <Input id="sortCode" placeholder="23-56-26" {...register('sortCode')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="abaNumber">ABA / routing number</Label>
            <Input id="abaNumber" placeholder="061000227" {...register('abaNumber')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input id="customerId" {...register('customerId')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAddress">Bank address</Label>
          <Input id="bankAddress" {...register('bankAddress')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="correspondentBank">Intermediary bank</Label>
            <Input id="correspondentBank" placeholder="JP Morgan Chase Bank, New York, USA" {...register('correspondentBank')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correspondentSwift">Intermediary SWIFT</Label>
            <Input id="correspondentSwift" placeholder="CHASUS33" {...register('correspondentSwift')} />
          </div>
        </div>
      </div>

      {/* Relationship-manager contact details from the bank-account master. */}
      <div className="space-y-4 rounded-md border p-3">
        <Label className="text-sm">Bank contact</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Relationship manager</Label>
            <Input id="contactName" {...register('contactName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">RM email</Label>
            <Input id="contactEmail" {...register('contactEmail')} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">RM telephone</Label>
            <Input id="contactPhone" {...register('contactPhone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhoneAlt">RM mobile</Label>
            <Input id="contactPhoneAlt" {...register('contactPhoneAlt')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fax">Fax</Label>
            <Input id="fax" {...register('fax')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="registeredEmail">Registered email with bank</Label>
          <Input id="registeredEmail" {...register('registeredEmail')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="remainingBalance">Remaining balance</Label>
          <Input id="remainingBalance" type="number" step="0.0001" min={0} {...register('remainingBalance')} />
          {errors.remainingBalance && <p className="text-xs text-destructive">{errors.remainingBalance.message}</p>}
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

      {/* Bank charge bands — tiered % charge by payment amount. */}
      <div className="space-y-2 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Charge bands</Label>
            <p className="text-xs text-muted-foreground">
              Bank charge as a % of the amount, by band. Leave max blank for the top “and above” band.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => bands.append({ minAmount: 0, maxAmount: '', percentage: 0 })}
          >
            <Plus className="mr-1 h-4 w-4" /> Add band
          </Button>
        </div>
        {bands.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No charge bands. Charges default to 0%.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
              <span>Min amount</span>
              <span>Max amount (blank = and above)</span>
              <span>Charge %</span>
              <span className="w-8" />
            </div>
            {bands.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
                <Input type="number" step="0.0001" min={0} placeholder="0" {...register(`chargeBands.${i}.minAmount`)} />
                <Input type="number" step="0.0001" min={0} placeholder="and above" {...register(`chargeBands.${i}.maxAmount`)} />
                <div>
                  <Input type="number" step="0.0001" min={0} max={100} placeholder="2" {...register(`chargeBands.${i}.percentage`)} />
                  {errors.chargeBands?.[i]?.maxAmount && (
                    <p className="text-xs text-destructive">{errors.chargeBands[i]?.maxAmount?.message}</p>
                  )}
                </div>
                <Button type="button" size="icon" variant="ghost" onClick={() => bands.remove(i)} title="Remove band">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {errors.chargeBands && typeof errors.chargeBands.message === 'string' && (
          <p className="text-xs text-destructive">{errors.chargeBands.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value === '' || value == null ? <span className="text-muted-foreground">—</span> : value}</div>
    </div>
  );
}

function BankAccountDetails({ account: a }: { account: BankAccount }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bank" value={a.bank?.name ?? a.bankName} />
        <Field label="Status" value={
          <span
            className={
              a.isActive
                ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
            }
          >
            {a.isActive ? 'Active' : 'Inactive'}
          </span>
        } />
        <Field label="Account number" value={<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.accountNumber}</code>} />
        <Field label="Account type" value={a.accountTypeMaster?.name} />
        <Field label="Currency" value={a.currency?.code ?? a.currency?.name} />
        <Field label="Nickname" value={a.bankNickname} />
        <Field label="Branch name" value={a.branchName} />
        <Field label="Branch code" value={a.branchCode} />
        <Field label="Opening balance" value={a.openingBalance != null ? Number(a.openingBalance).toLocaleString() : null} />
        <Field label="Minimum balance" value={a.minimumBalance != null ? Number(a.minimumBalance).toLocaleString() : null} />
        <Field label="Remaining balance" value={a.remainingBalance != null ? Number(a.remainingBalance).toLocaleString() : null} />
        <Field label="Chairman-designated" value={a.isChairmanDesignated ? 'Yes' : 'No'} />
        <Field label="Account holder" value={a.accountHolderName} />
        <Field label="Authorised signatory" value={a.authSignatory} />
      </div>

      <div className="rounded-md border p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide">Bank &amp; clearing details</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SWIFT / BIC" value={a.swiftBic} />
          <Field label="IBAN" value={a.iban} />
          <Field label="Bank code" value={a.bankCode} />
          <Field label="Sort code" value={a.sortCode} />
          <Field label="ABA / routing" value={a.abaNumber} />
          <Field label="Customer ID" value={a.customerId} />
          <Field label="Intermediary bank" value={a.correspondentBank} />
          <Field label="Intermediary SWIFT" value={a.correspondentSwift} />
        </div>
        <div className="mt-4">
          <Field label="Bank address" value={a.bankAddress} />
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide">Bank contact</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Relationship manager" value={a.contactName} />
          <Field label="RM email" value={a.contactEmail} />
          <Field label="RM telephone" value={a.contactPhone} />
          <Field label="RM mobile" value={a.contactPhoneAlt} />
          <Field label="Fax" value={a.fax} />
          <Field label="Registered email" value={a.registeredEmail} />
        </div>
      </div>

      <Field label="Charge bands" value={
        a.chargeBands && a.chargeBands.length > 0 ? (
          <div className="space-y-0.5">
            {a.chargeBands.map((b, i) => (
              <div key={b.id ?? i} className="whitespace-nowrap tabular-nums">
                {Number(b.minAmount).toLocaleString()}
                {b.maxAmount == null ? '+' : `–${Number(b.maxAmount).toLocaleString()}`}
                {' · '}
                <span className="font-medium">{Number(b.percentage)}%</span>
              </div>
            ))}
          </div>
        ) : null
      } />
    </div>
  );
}

/** Optional text fields are sent only when filled — blanks must not overwrite. */
const OPTIONAL_TEXT_FIELDS = [
  'branchName', 'branchCode', 'accountHolderName', 'swiftBic', 'iban', 'abaNumber',
  'bankCode', 'sortCode', 'customerId', 'bankAddress', 'correspondentBank',
  'correspondentSwift', 'contactName', 'contactPhone', 'contactPhoneAlt',
  'contactEmail', 'fax', 'authSignatory', 'registeredEmail',
] as const;

function normalize(d: FormData) {
  const text = Object.fromEntries(
    OPTIONAL_TEXT_FIELDS.map((k) => [k, d[k] ? d[k] : undefined]),
  );
  return {
    bankId: d.bankId,
    legalEntityId: d.legalEntityId ? d.legalEntityId : undefined,
    currencyId: d.currencyId,
    accountTypeId: d.accountTypeId,
    accountNumber: d.accountNumber,
    ...text,
    openingBalance: d.openingBalance,
    minimumBalance: d.minimumBalance,
    remainingBalance: d.remainingBalance,
    isChairmanDesignated: d.isChairmanDesignated ?? false,
    isActive: d.isActive ?? true,
    chargeBands: (d.chargeBands ?? []).map((b) => ({
      minAmount: Number(b.minAmount),
      maxAmount: b.maxAmount === '' || b.maxAmount == null ? null : Number(b.maxAmount),
      percentage: Number(b.percentage),
    })),
  };
}

export default function BankAccountsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<BankAccount | null>(null);
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
              {/* Body scrolls on its own so the title and close button stay put. */}
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <BankAccountForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by bank, legal entity or account number" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-md" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank / Legal entity</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Charges</TableHead>
              <TableHead>Chairman</TableHead>
              <TableHead>Status</TableHead>
              {/* Wide enough for three 40px icon buttons plus cell padding. */}
              <TableHead className="w-40 whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((a) => {
              // Highlight accounts whose remaining balance is below the minimum
              // (same rule as the dashboard "Urgent attention" alert).
              const belowMin =
                a.isActive &&
                a.remainingBalance != null &&
                a.minimumBalance != null &&
                Number(a.remainingBalance) < Number(a.minimumBalance);
              return (
              <TableRow key={a.id} className={belowMin ? 'bg-red-50/60 hover:bg-red-50' : undefined}>
                <TableCell>
                  <div className="font-medium">{a.bank?.name ?? a.bankName ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{a.bankNickname ?? '—'}</div>
                </TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.accountNumber}</code></TableCell>
                <TableCell>{a.currency?.code ?? a.currency?.name ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.minimumBalance != null ? Number(a.minimumBalance).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={belowMin ? 'font-semibold text-red-700' : undefined}>
                    {a.remainingBalance != null ? Number(a.remainingBalance).toLocaleString() : '—'}
                  </span>
                  {belowMin && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 align-middle text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" /> Below min
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.chargeBands && a.chargeBands.length > 0 ? (
                    <div className="space-y-0.5">
                      {a.chargeBands.map((b, i) => (
                        <div key={b.id ?? i} className="whitespace-nowrap tabular-nums">
                          {Number(b.minAmount).toLocaleString()}
                          {b.maxAmount == null ? '+' : `–${Number(b.maxAmount).toLocaleString()}`}
                          {' · '}
                          <span className="font-medium text-foreground">{Number(b.percentage)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : '—'}
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
                  {/* Keep the three actions on one row regardless of column width. */}
                  <div className="flex flex-nowrap items-center justify-end">
                    <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setViewing(a)} title="View"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setEditing(a)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setDeleting(a)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No bank accounts yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Bank account details</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {viewing && <BankAccountDetails account={viewing} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit bank account</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {editing && <BankAccountForm defaultValues={editing} submitting={updateMut.isPending} onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })} />}
          </div>
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
