'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { hasAnyRole, RoleCode } from '@/lib/roles';
import type {
  BankAccount,
  BeneficiaryAccount,
  Counterparty,
  Currency,
  LegalEntity,
  Paginated,
  PaymentType,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

const documentSchema = z.object({
  documentCode: z.string().min(1).max(50),
  documentLabel: z.string().optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  mimeType: z.string().optional(),
});

export const paymentRequestSchema = z.object({
  paymentTypeId: z.string().uuid('Select a payment type'),
  legalEntityId: z.string().uuid('Select a legal entity'),
  counterpartyId: z.string().uuid().optional().or(z.literal('')),
  beneficiaryAccountId: z.string().uuid().optional().or(z.literal('')),
  sourceAccountId: z.string().uuid().optional().or(z.literal('')),
  currencyId: z.string().uuid('Select a currency'),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Positive decimal, up to 4 dp'),
  purposeDescription: z.string().optional(),
  invoiceNumber: z
    .string()
    .regex(/^[A-Za-z0-9\-_/]*$/, 'Alphanumeric only — no spaces')
    .optional()
    .or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  documents: z.array(documentSchema).optional(),
});
export type PaymentRequestFormData = z.infer<typeof paymentRequestSchema>;

export function PaymentRequestForm({
  onSubmit, submitting,
}: {
  onSubmit: (d: PaymentRequestFormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PaymentRequestFormData>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: { documents: [] },
  });

  const counterpartyId = watch('counterpartyId');
  const currencyId = watch('currencyId');

  // Non-admin users see only payment types they're eligible to act as
  // Maker for (matching either pt.maker_role_id IN their roles, or
  // pt.maker_user_id = their id). Admin sees everything; the backend
  // ignores the mine flag when absent.
  const { user } = useAuth();
  const isAdmin = hasAnyRole(user?.roles, [RoleCode.SUPER_ADMIN]);

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types-for-request', isAdmin],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '200' });
      if (!isAdmin) params.set('mine', 'true');
      return api.get<Paginated<PaymentType>>(`/payment-types?${params.toString()}`);
    },
  });
  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
  });
  const { data: counterparties } = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=200'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  // Group-own bank accounts (master) — pool of source accounts from which
  // the payment will be released. Cross-currency release is blocked, so the
  // dropdown is filtered to the request currency once chosen.
  const { data: sourceAccounts } = useQuery({
    queryKey: ['bank-accounts-source'],
    queryFn: () => api.get<Paginated<BankAccount>>('/bank-accounts?page=1&limit=200'),
  });
  // §4.1 — destination beneficiary list is filtered to the chosen counterparty,
  // and to payable accounts only (ACTIVE, cooling-off elapsed).
  const { data: beneficiaries } = useQuery({
    queryKey: ['beneficiary-accounts-payable', counterpartyId],
    queryFn: () =>
      api.get<Paginated<BeneficiaryAccount>>(
        `/beneficiary-accounts?page=1&limit=200&counterpartyId=${counterpartyId}&payableOnly=true`,
      ),
    enabled: !!counterpartyId,
  });

  const paymentTypeOptions = (paymentTypes?.data ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }));

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="paymentTypeId">Payment type <span className="text-destructive">*</span></Label>
        <Select id="paymentTypeId"
          placeholder={paymentTypeOptions.length === 0 ? 'No payment types available for your role' : 'Select payment type'}
          disabled={paymentTypeOptions.length === 0}
          options={paymentTypeOptions}
          {...register('paymentTypeId')} />
        {errors.paymentTypeId && <p className="text-xs text-destructive">{errors.paymentTypeId.message}</p>}
        {!isAdmin && (
          <p className="text-xs text-muted-foreground">Showing only payment types where you are the configured Maker.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="legalEntityId">Legal entity <span className="text-destructive">*</span></Label>
        <Select id="legalEntityId" placeholder="Select"
          options={(legalEntities?.data ?? []).filter((le) => le.isActive).map((le) => ({ label: `${le.code} — ${le.name}`, value: le.id }))}
          {...register('legalEntityId')} />
        {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="counterpartyId">Counterparty</Label>
          <Select id="counterpartyId" placeholder="Select (vendor payments)"
            options={[{ label: '— None —', value: '' }, ...(counterparties?.data ?? []).map((c) => ({ label: c.legalName ?? c.id, value: c.id }))]}
            {...register('counterpartyId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beneficiaryAccountId">Destination beneficiary</Label>
          <Select id="beneficiaryAccountId"
            placeholder={counterpartyId ? 'Select payable account' : 'Pick a counterparty first'}
            disabled={!counterpartyId}
            options={[
              { label: '— None —', value: '' },
              ...(beneficiaries?.data ?? []).map((b) => ({
                label: `${b.accountHolderName} · ${b.accountNumber}${b.country?.isSanctioned ? ' (sanctioned country)' : ''}`,
                value: b.id,
              })),
            ]}
            {...register('beneficiaryAccountId')} />
          <p className="text-xs text-muted-foreground">§4.1 — only verified, payable accounts of the selected counterparty.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceAccountId">Pay from (source bank account)</Label>
        <Select id="sourceAccountId"
          placeholder={currencyId ? 'Select source account' : 'Pick a currency first'}
          disabled={!currencyId}
          options={[
            { label: '— None —', value: '' },
            ...(sourceAccounts?.data ?? [])
              .filter((a) => a.isActive && a.currencyId === currencyId)
              .map((a) => {
                const bankLabel = a.bankNickname || a.bank?.name || a.bankName || 'Bank';
                return {
                  label: `${bankLabel} · ${a.accountNumber}`,
                  value: a.id,
                };
              }),
          ]}
          {...register('sourceAccountId')} />
        <p className="text-xs text-muted-foreground">From the bank-accounts master. Only active accounts in the request currency are listed; the Maker may change this at release time.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currencyId">Currency <span className="text-destructive">*</span></Label>
          <Select id="currencyId" placeholder="Select"
            options={(currencies?.data ?? []).map((c) => ({ label: c.code ? `${c.code} — ${c.name ?? ''}` : (c.name ?? c.id), value: c.id }))}
            {...register('currencyId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
          <Input id="amount" inputMode="decimal" placeholder="0.0000" {...register('amount')} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice number</Label>
          <Input id="invoiceNumber" placeholder="INV-2026-0001" {...register('invoiceNumber')} />
          {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber.message}</p>}
          <p className="text-xs text-muted-foreground">§4.1 — alphanumeric only; spaces are not permitted.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purposeDescription">Purpose</Label>
          <Textarea id="purposeDescription" rows={2} {...register('purposeDescription')} />
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Documents</p>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ documentCode: '', documentLabel: '', fileName: '', fileUrl: '' })}>
            <Plus className="mr-1 h-3 w-3" /> Add document
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">§4.1 — attach the documents required by the selected payment type (invoice, PO, GRN, etc.).</p>
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents attached yet.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                <div>
                  <Label className="text-xs">Code</Label>
                  <Input placeholder="INVOICE" {...register(`documents.${idx}.documentCode`)} />
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input placeholder="Invoice PDF" {...register(`documents.${idx}.documentLabel`)} />
                </div>
                <div>
                  <Label className="text-xs">Filename</Label>
                  <Input placeholder="invoice.pdf" {...register(`documents.${idx}.fileName`)} />
                </div>
                <div>
                  <Label className="text-xs">URL</Label>
                  <Input placeholder="/uploads/invoice.pdf" {...register(`documents.${idx}.fileUrl`)} />
                </div>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save as draft'}</Button>
      </DialogFooter>
    </form>
  );
}
