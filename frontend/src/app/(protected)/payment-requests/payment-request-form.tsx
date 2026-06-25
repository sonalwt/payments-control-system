'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type ExtractedInvoice } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type {
  BankAccount,
  BeneficiaryAccount,
  Counterparty,
  Currency,
  LegalEntity,
  Paginated,
  PaymentType,
  Role,
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
  counterpartyId: z.string().uuid().optional().or(z.literal('')),
  beneficiaryAccountId: z.string().uuid().optional().or(z.literal('')),
  // Legal entity is chosen by the maker (from the payment type's entities); the
  // source bank account is no longer picked here — the Treasury Maker picks it.
  legalEntityId: z.string().uuid('Select a legal entity'),
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

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';
interface DocUploadState { status: UploadStatus; error: string }

type CompareRow = { label: string; entered: string; extracted: string; status: 'match' | 'mismatch' };

/** Compare auto-read invoice fields against what the user entered (warn-only). */
function compareInvoice(
  ext: ExtractedInvoice,
  entered: { amount?: string; invoiceNumber?: string },
): CompareRow[] {
  const rows: CompareRow[] = [];
  if (ext.amount != null) {
    const e = (entered.amount ?? '').trim();
    const enteredNum = Number(e);
    const extractedNum = Number(ext.amount);
    const status =
      e !== '' && Number.isFinite(enteredNum) && Math.abs(enteredNum - extractedNum) < 0.0001
        ? 'match'
        : 'mismatch';
    rows.push({ label: 'Amount', entered: e || '—', extracted: ext.amount, status });
  }
  if (ext.invoiceNumber != null) {
    const norm = (s: string): string => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const e = (entered.invoiceNumber ?? '').trim();
    const status = e !== '' && norm(e) === norm(ext.invoiceNumber) ? 'match' : 'mismatch';
    rows.push({ label: 'Invoice no.', entered: e || '—', extracted: ext.invoiceNumber, status });
  }
  return rows;
}

export function PaymentRequestForm({
  onSubmit, submitting, defaultValues, submitLabel = 'Save as draft', showDocuments = true,
}: {
  onSubmit: (d: PaymentRequestFormData) => void;
  submitting?: boolean;
  defaultValues?: Partial<PaymentRequestFormData>;
  submitLabel?: string;
  showDocuments?: boolean;
}): React.ReactElement {
  // §4.1 — when the documents section is shown (create flow), at least one
  // supporting document is mandatory. The edit flow hides documents, so it
  // keeps the base (optional) schema.
  const formSchema = useMemo(
    () =>
      showDocuments
        ? paymentRequestSchema.refine((d) => (d.documents?.length ?? 0) >= 1, {
            message: 'Attach at least one document.',
            path: ['documents'],
          })
        : paymentRequestSchema,
    [showDocuments],
  );

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PaymentRequestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { documents: [], ...defaultValues },
  });

  // Hydrate the form when default values arrive asynchronously (edit mode).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!hydrated && defaultValues) {
      reset({ documents: [], ...defaultValues });
      setPaymentTypeId(defaultValues.paymentTypeId ?? '');
      setLegalEntityId(defaultValues.legalEntityId ?? '');
      setCurrencyId(defaultValues.currencyId ?? '');
      setHydrated(true);
    }
  }, [defaultValues, hydrated, reset]);

  const [docUploadStates, setDocUploadStates] = useState<DocUploadState[]>([]);
  // Warn-only invoice auto-read results, keyed by document index. Advisory:
  // surfaced as a comparison panel, never blocks submission.
  const [docExtractions, setDocExtractions] = useState<(ExtractedInvoice | null)[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleDocUpload(idx: number, file: File): Promise<void> {
    setDocUploadStates((prev) => {
      const next = [...prev];
      next[idx] = { status: 'uploading', error: '' };
      return next;
    });
    // Clear any prior auto-read for this slot before re-uploading.
    setDocExtractions((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
    try {
      const result = await api.upload(file);
      setValue(`documents.${idx}.fileName`, result.fileName, { shouldValidate: true });
      setValue(`documents.${idx}.fileUrl`, result.url, { shouldValidate: true });
      setDocUploadStates((prev) => {
        const next = [...prev];
        next[idx] = { status: 'done', error: '' };
        return next;
      });
      // Fire-and-forget invoice auto-read (PDFs only). Failures are silent —
      // this is an optional cross-check, not part of the upload contract.
      if (file.type === 'application/pdf') {
        api
          .extractInvoice(file)
          .then((extracted) => {
            setDocExtractions((prev) => {
              const next = [...prev];
              next[idx] = extracted;
              return next;
            });
          })
          .catch(() => {
            /* ignore — auto-read is best-effort */
          });
      }
    } catch (err) {
      setDocUploadStates((prev) => {
        const next = [...prev];
        next[idx] = { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' };
        return next;
      });
    }
  }

  const counterpartyId = useWatch({ control, name: 'counterpartyId' });
  // §4.3 — the maker chooses a legal entity (from the payment type's entities)
  // and then a currency derived from that entity's bank accounts. The source
  // bank account itself is picked later by the Treasury Maker.
  //
  // These three cross-field drivers are mirrored in component state rather than
  // read via RHF watch/useWatch: the watch subscription was not re-rendering
  // the dependent dropdowns when their parent changed (the legal entity list
  // only appeared after touching another field). Component state guarantees the
  // re-render; RHF is kept in sync via setValue so submission/validation work.
  const [paymentTypeId, setPaymentTypeId] = useState(defaultValues?.paymentTypeId ?? '');
  const [legalEntityId, setLegalEntityId] = useState(defaultValues?.legalEntityId ?? '');
  const [currencyId, setCurrencyId] = useState(defaultValues?.currencyId ?? '');

  // Set a cross-field driver in both component state and RHF at once.
  const setField = (
    name: 'paymentTypeId' | 'legalEntityId' | 'currencyId',
    value: string,
    localSetter: (v: string) => void,
  ): void => {
    localSetter(value);
    setValue(name, value, { shouldValidate: true, shouldDirty: true });
  };

  const { user } = useAuth();

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types-for-request'],
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?page=1&limit=200'),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });
  const { data: counterparties } = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=200'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
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

  // Role IDs the current user holds (user.roles are role codes; maker roles
  // on a payment type are stored as role IDs).
  const heldRoleIds = new Set(
    (roles ?? []).filter((r) => user?.roles?.includes(r.code)).map((r) => r.id),
  );
  // A payment type is creatable if the user holds any of its maker roles
  // (multi-select makerRoleIds, or the legacy single makerRole).
  const paymentTypeOptions = (paymentTypes?.data ?? [])
    .filter((p) => {
      if (!p.isActive) return false;
      const ids = p.makerRoleIds?.length ? p.makerRoleIds : p.makerRoleId ? [p.makerRoleId] : [];
      if (ids.some((id) => heldRoleIds.has(id))) return true;
      return !!p.makerRole?.code && !!user?.roles?.includes(p.makerRole.code);
    })
    .map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }));

  // §4.3 — the maker picks the legal entity (constrained to the chosen payment
  // type's legal entities), then a currency drawn from that entity's bank
  // accounts. The source bank account is no longer selected here.
  const accounts = sourceAccounts?.data ?? [];
  const selectedPaymentType = (paymentTypes?.data ?? []).find((p) => p.id === paymentTypeId);
  // A payment type may belong to several legal entities (multi-select); fall
  // back to the legacy single legalEntityId for older records. Confidential
  // (chairman-style) types carry no legal entity — for those we offer any
  // entity that owns an active bank account so a currency can still be chosen.
  const entityIdsWithAccounts = new Set(
    accounts.filter((a) => a.isActive && a.legalEntityId).map((a) => a.legalEntityId),
  );
  const configuredLegalEntityIds =
    selectedPaymentType?.legalEntityIds?.length
      ? selectedPaymentType.legalEntityIds
      : selectedPaymentType?.legalEntityId
        ? [selectedPaymentType.legalEntityId]
        : [];
  const paymentTypeLegalEntityIds =
    configuredLegalEntityIds.length > 0
      ? configuredLegalEntityIds
      : selectedPaymentType
        ? Array.from(entityIdsWithAccounts).filter((id): id is string => !!id)
        : [];
  const legalEntityOptions = (legalEntities?.data ?? [])
    .filter((le) => le.isActive && paymentTypeLegalEntityIds.includes(le.id))
    .map((le) => ({ label: `${le.code} — ${le.name}`, value: le.id }));

  // Distinct currencies available across the selected legal entity's active
  // bank accounts — these are the currencies the maker may choose from.
  const currencyCodeById = new Map(
    (currencies?.data ?? []).map((c) => [c.id, c.code ?? c.name]),
  );
  const legalEntityCurrencyIds: string[] = [];
  for (const a of accounts) {
    if (a.isActive && a.legalEntityId === legalEntityId && a.currencyId && !legalEntityCurrencyIds.includes(a.currencyId)) {
      legalEntityCurrencyIds.push(a.currencyId);
    }
  }
  const currencyOptions = legalEntityCurrencyIds.map((id) => ({
    label: currencyCodeById.get(id) ?? id,
    value: id,
  }));

  // Keep the legal entity valid for the chosen payment type: auto-select when
  // there is only one, and clear a stale selection that no longer belongs.
  useEffect(() => {
    if (!paymentTypeId || !legalEntities) return;
    if (paymentTypeLegalEntityIds.length === 1) {
      if (legalEntityId !== paymentTypeLegalEntityIds[0]) {
        setField('legalEntityId', paymentTypeLegalEntityIds[0], setLegalEntityId);
      }
    } else if (legalEntityId && !paymentTypeLegalEntityIds.includes(legalEntityId)) {
      setField('legalEntityId', '', setLegalEntityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTypeId, paymentTypeLegalEntityIds.join(','), legalEntities]);

  // Keep the currency valid for the chosen legal entity: auto-select when there
  // is only one, and clear a stale selection once the accounts have loaded.
  useEffect(() => {
    if (!legalEntityId || !sourceAccounts) return;
    if (legalEntityCurrencyIds.length === 1) {
      if (currencyId !== legalEntityCurrencyIds[0]) {
        setField('currencyId', legalEntityCurrencyIds[0], setCurrencyId);
      }
    } else if (currencyId && !legalEntityCurrencyIds.includes(currencyId)) {
      setField('currencyId', '', setCurrencyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalEntityId, legalEntityCurrencyIds.join(','), sourceAccounts]);

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="paymentTypeId">Payment type <span className="text-destructive">*</span></Label>
        <input type="hidden" {...register('paymentTypeId')} />
        <Select id="paymentTypeId"
          placeholder={paymentTypeOptions.length === 0 ? 'No payment types available for your role' : 'Select payment type'}
          disabled={paymentTypeOptions.length === 0}
          options={paymentTypeOptions}
          value={paymentTypeId}
          onChange={(e) => {
            setField('paymentTypeId', e.target.value, setPaymentTypeId);
            // Reset downstream selections — they depend on the payment type.
            setField('legalEntityId', '', setLegalEntityId);
            setField('currencyId', '', setCurrencyId);
          }} />
        {errors.paymentTypeId && <p className="text-xs text-destructive">{errors.paymentTypeId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="legalEntityId">Legal entity <span className="text-destructive">*</span></Label>
          <input type="hidden" {...register('legalEntityId')} />
          <Select id="legalEntityId"
            placeholder={paymentTypeId ? 'Select legal entity' : 'Pick a payment type first'}
            disabled={!paymentTypeId}
            options={legalEntityOptions}
            value={legalEntityId}
            onChange={(e) => {
              setField('legalEntityId', e.target.value, setLegalEntityId);
              setField('currencyId', '', setCurrencyId);
            }} />
          <p className="text-xs text-muted-foreground">Legal entities configured on the selected payment type.</p>
          {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyId">Currency <span className="text-destructive">*</span></Label>
          <input type="hidden" {...register('currencyId')} />
          <Select id="currencyId"
            placeholder={legalEntityId ? 'Select currency' : 'Pick a legal entity first'}
            disabled={!legalEntityId}
            options={currencyOptions}
            value={currencyId}
            onChange={(e) => setField('currencyId', e.target.value, setCurrencyId)} />
          <p className="text-xs text-muted-foreground">Currencies of the selected legal entity&apos;s bank accounts.</p>
          {errors.currencyId && <p className="text-xs text-destructive">{errors.currencyId.message}</p>}
        </div>
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

      <div className="grid grid-cols-2 gap-4">
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

      {showDocuments && (
      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Documents <span className="text-destructive">*</span></p>
          <Button
            type="button" size="sm" variant="outline"
            onClick={() => {
              append({ documentCode: '', documentLabel: '', fileName: '', fileUrl: '' });
              setDocUploadStates((prev) => [...prev, { status: 'idle', error: '' }]);
              setDocExtractions((prev) => [...prev, null]);
            }}
          >
            <Plus className="mr-1 h-3 w-3" /> Add document
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">§4.1 — attach the documents required by the selected payment type (invoice, PO, GRN, etc.). At least one document is required.</p>
        {errors.documents?.message && (
          <p className="text-xs text-destructive">{errors.documents.message}</p>
        )}
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents attached yet.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f, idx) => {
              const upState = docUploadStates[idx] ?? { status: 'idle', error: '' };
              const docFileName = watch(`documents.${idx}.fileName`);
              return (
                <div key={f.id} className="rounded-md border p-2 space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <Label className="text-xs">Code</Label>
                      <Input placeholder="INVOICE" {...register(`documents.${idx}.documentCode`)} />
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input placeholder="Invoice PDF" {...register(`documents.${idx}.documentLabel`)} />
                    </div>
                    <Button
                      type="button" size="icon" variant="ghost"
                      onClick={() => {
                        remove(idx);
                        setDocUploadStates((prev) => prev.filter((_, i) => i !== idx));
                        setDocExtractions((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* File upload */}
                  <input type="hidden" {...register(`documents.${idx}.fileName`)} />
                  <input type="hidden" {...register(`documents.${idx}.fileUrl`)} />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleDocUpload(idx, file);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button" variant="outline" size="sm"
                      disabled={upState.status === 'uploading'}
                      onClick={() => fileInputRefs.current[idx]?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {upState.status === 'done' ? 'Replace file' : 'Choose file'}
                    </Button>
                    {upState.status === 'uploading' && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                      </span>
                    )}
                    {upState.status === 'done' && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {docFileName}
                      </span>
                    )}
                    {upState.status === 'idle' && (
                      <span className="text-sm text-muted-foreground">No file selected</span>
                    )}
                  </div>
                  {upState.status === 'error' && (
                    <p className="text-xs text-destructive">{upState.error}</p>
                  )}

                  {/* Warn-only invoice auto-read cross-check (PDF invoices). */}
                  {(() => {
                    const ext = docExtractions[idx];
                    const code = watch(`documents.${idx}.documentCode`) ?? '';
                    if (!ext || !/inv/i.test(code)) return null;
                    if (!ext.readable) {
                      return (
                        <div className="rounded-md border border-muted bg-muted/40 p-2 text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{ext.reason ?? 'Could not auto-read this invoice. Please verify manually.'}</span>
                        </div>
                      );
                    }
                    const rows = compareInvoice(ext, {
                      amount: watch('amount'),
                      invoiceNumber: watch('invoiceNumber'),
                    });
                    if (rows.length === 0) {
                      return (
                        <div className="rounded-md border border-muted bg-muted/40 p-2 text-xs text-muted-foreground">
                          Invoice read, but no amount or invoice number could be identified to compare.
                        </div>
                      );
                    }
                    const anyMismatch = rows.some((r) => r.status === 'mismatch');
                    return (
                      <div className={`rounded-md border p-2 text-xs space-y-1 ${anyMismatch ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                        <p className="font-medium flex items-center gap-1.5">
                          {anyMismatch
                            ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          {anyMismatch ? 'Invoice does not match entered values' : 'Invoice matches entered values'}
                        </p>
                        {rows.map((r) => (
                          <div key={r.label} className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="flex items-center gap-2">
                              <span>entered: <b>{r.entered}</b></span>
                              <span>invoice: <b>{r.extracted}</b></span>
                              {r.status === 'match'
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                            </span>
                          </div>
                        ))}
                        <p className="text-[11px] text-muted-foreground pt-1">
                          Auto-read is advisory and may be inaccurate — it does not block submission.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
