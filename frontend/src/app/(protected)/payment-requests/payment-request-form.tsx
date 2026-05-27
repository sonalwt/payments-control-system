'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, FileText, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNotify } from '@/hooks/use-notify';
import { api } from '@/lib/api';
import type { BeneficiaryAccount, Counterparty, Employee, LegalEntity, PaymentType, SanctionedCountry } from '@/types/domain';

const documentSchema = z.object({
  documentCode: z.string().min(1, 'Code required').max(50),
  documentLabel: z.string().optional(),
  fileName: z.string().min(1, 'File name required'),
  fileUrl: z.string().min(1, 'File URL required'),
  mimeType: z.string().optional(),
});

const schema = z.object({
  paymentTypeCode: z.string().min(1, 'Payment type required'),
  legalEntityId: z.string().uuid('Legal entity required'),
  counterpartyId: z.string().uuid().optional().or(z.literal('')),
  employeeId: z.string().uuid().optional().or(z.literal('')),
  beneficiaryAccountId: z.string().uuid().optional().or(z.literal('')),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Enter a valid positive amount'),
  purposeDescription: z.string().optional(),
  invoiceNumber: z
    .string()
    .regex(/^[A-Za-z0-9\-_/]*$/, 'No spaces allowed — hyphens and slashes are permitted')
    .optional()
    .or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  documents: z.array(documentSchema).optional(),
});

export type PaymentRequestFormData = z.infer<typeof schema>;

interface Props {
  paymentTypes: PaymentType[];
  legalEntities: LegalEntity[];
  counterparties: Counterparty[];
  employees: Employee[];
  beneficiaryAccounts: BeneficiaryAccount[];
  sanctionedCountryCodes: Set<string>;
  defaultValues?: Partial<PaymentRequestFormData>;
  submitting?: boolean;
  onSubmit: (data: PaymentRequestFormData) => void;
}

function SectionHeader({ step, title, description }: { step: number; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {step}
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function PaymentRequestForm({
  paymentTypes,
  legalEntities,
  counterparties,
  employees,
  beneficiaryAccounts,
  sanctionedCountryCodes,
  defaultValues,
  submitting,
  onSubmit,
}: Props): React.ReactElement {
  const form = useForm<PaymentRequestFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      paymentTypeCode: '',
      legalEntityId: '',
      currencyCode: '',
      amount: '',
      documents: [],
    },
  });

  const notify = useNotify();
  const [uploadingDocIdx, setUploadingDocIdx] = useState<number>(-1);

  const { fields: docFields, append: addDoc, remove: removeDoc } = useFieldArray({
    control: form.control,
    name: 'documents',
  });

  const selectedTypeCode = form.watch('paymentTypeCode');
  const selectedBeneId = form.watch('beneficiaryAccountId');
  const selectedCounterpartyId = form.watch('counterpartyId');
  const selectedType = paymentTypes.find((pt) => pt.code === selectedTypeCode);
  const outgoing = selectedType?.direction === 'OUTGOING';
  const isVendorPayment = selectedTypeCode === 'VENDOR_PAYMENT';
  const needsCounterparty =
    selectedTypeCode === 'VENDOR_PAYMENT' ||
    selectedTypeCode === 'INCOMING_RECEIPT' ||
    selectedTypeCode === 'CHAIRMAN';
  const needsEmployee =
    selectedTypeCode === 'PAYROLL' ||
    selectedTypeCode === 'REIMBURSEMENT' ||
    selectedTypeCode === 'FNF';

  const filteredBeneficiaryAccounts = beneficiaryAccounts.filter((b) => {
    if (b.status !== 'ACTIVE') return false;
    if (selectedCounterpartyId && b.counterpartyId)
      return b.counterpartyId === selectedCounterpartyId;
    return true;
  });

  const selectedBene = beneficiaryAccounts.find((b) => b.id === selectedBeneId);
  const isSanctioned =
    !!selectedBene && sanctionedCountryCodes.has(selectedBene.countryCode.toUpperCase());

  const requiredDocs = selectedType?.documentPolicy?.filter((d) => d.required) ?? [];

  // Dynamic step numbering
  let step = 1;
  const recipientStep = (needsCounterparty || needsEmployee || outgoing) ? step++ + 1 : null;
  const invoiceStep = isVendorPayment ? step++ + 1 : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

      {/* Section 1 — Payment Classification */}
      <Card className="p-5">
        <SectionHeader
          step={1}
          title="Payment Classification"
          description="Select the payment type and the company initiating the payment"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Payment Type<RequiredMark />
            </Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...form.register('paymentTypeCode')}
            >
              <option value="">Select payment type…</option>
              {paymentTypes
                .filter((pt) => pt.isActive)
                .map((pt) => (
                  <option key={pt.code} value={pt.code}>
                    {pt.name}
                  </option>
                ))}
            </select>
            <FieldError message={form.formState.errors.paymentTypeCode?.message} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Legal Entity<RequiredMark />
            </Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...form.register('legalEntityId')}
            >
              <option value="">Select company…</option>
              {legalEntities.map((le) => (
                <option key={le.id} value={le.id}>
                  {le.name} ({le.code})
                </option>
              ))}
            </select>
            <FieldError message={form.formState.errors.legalEntityId?.message} />
          </div>
        </div>
      </Card>

      {/* Section 2 — Recipient */}
      {(needsCounterparty || needsEmployee || outgoing) && (
        <Card className="p-5">
          <SectionHeader
            step={2}
            title="Recipient"
            description="Specify who will receive this payment and the destination account"
          />
          <div className="space-y-4">
            {needsCounterparty && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Counterparty</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...form.register('counterpartyId')}
                >
                  <option value="">No counterparty</option>
                  {counterparties.filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsEmployee && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Employee</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...form.register('employeeId')}
                >
                  <option value="">Select employee…</option>
                  {employees.filter((e) => e.isActive).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {outgoing && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Beneficiary Account<RequiredMark />
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    from verified master
                  </span>
                </Label>
                {isVendorPayment && selectedCounterpartyId && (
                  <p className="text-xs text-muted-foreground">
                    Showing accounts linked to the selected counterparty only.
                  </p>
                )}
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...form.register('beneficiaryAccountId')}
                >
                  <option value="">Select beneficiary account…</option>
                  {filteredBeneficiaryAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountHolderName} — {b.accountNumber}
                      {b.bank ? ` · ${b.bank.shortName ?? b.bank.name}` : ''}
                      {' · '}{b.currency?.code ?? b.currencyId}
                      {b.counterparty ? ` · ${b.counterparty.name}` : ''}
                      {b.employee ? ` · ${b.employee.fullName}` : ''}
                    </option>
                  ))}
                </select>
                {filteredBeneficiaryAccounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCounterpartyId
                      ? 'No active beneficiary accounts for this counterparty. Add one under Masters → Beneficiary Accounts.'
                      : 'No active beneficiary accounts yet. Add one under Masters → Beneficiary Accounts.'}
                  </p>
                )}
                {isSanctioned && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Sanctioned country alert:</strong> This beneficiary&apos;s country ({selectedBene?.countryCode}) is on the sanctioned list. All approvers will need to acknowledge this flag before the payment can proceed.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Section — Invoice Details (VENDOR_PAYMENT only) */}
      {isVendorPayment && (
        <Card className="p-5">
          <SectionHeader
            step={invoiceStep ?? 3}
            title="Invoice Details"
            description="Reference information from the supplier invoice"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Invoice Number<RequiredMark />
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">alphanumeric, no spaces</span>
              </Label>
              <Input
                placeholder="e.g. INV-2024-00123"
                {...form.register('invoiceNumber')}
              />
              <FieldError message={form.formState.errors.invoiceNumber?.message} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Due Date<RequiredMark />
              </Label>
              <Input type="date" {...form.register('dueDate')} />
              <FieldError message={form.formState.errors.dueDate?.message} />
            </div>
          </div>
        </Card>
      )}

      {/* Section — Amount & Purpose */}
      <Card className="p-5">
        <SectionHeader
          step={invoiceStep ? (invoiceStep + 1) : (recipientStep ? 3 : 2)}
          title="Amount & Purpose"
          description="Enter the payment amount and a brief description"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Currency<RequiredMark />
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">ISO 4217</span>
              </Label>
              <Input
                placeholder="e.g. AED"
                maxLength={3}
                className="uppercase tracking-widest font-mono"
                {...form.register('currencyCode')}
              />
              <FieldError message={form.formState.errors.currencyCode?.message} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Amount<RequiredMark />
              </Label>
              <Input
                placeholder="e.g. 5,000.00"
                {...form.register('amount')}
              />
              <FieldError message={form.formState.errors.amount?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Purpose / Description</Label>
            <Textarea
              placeholder="Briefly describe the purpose of this payment…"
              rows={3}
              className="resize-none"
              {...form.register('purposeDescription')}
            />
          </div>
        </div>
      </Card>

      {/* Section — Supporting Documents */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Supporting Documents</p>
              {requiredDocs.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Required: {requiredDocs.map((d) => d.label).join(', ')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attach any supporting files (PDF or Word)
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              addDoc({
                documentCode: selectedType?.documentPolicy?.[docFields.length]?.code ?? '',
                documentLabel: selectedType?.documentPolicy?.[docFields.length]?.label ?? '',
                fileName: '',
                fileUrl: '',
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add document
          </Button>
        </div>

        {docFields.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-muted-foreground/20 py-8 text-center">
            <Paperclip className="mx-auto h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No documents attached yet</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Click "Add document" to attach files</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docFields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-end rounded-md border bg-muted/20 p-3"
              >
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Code</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="invoice"
                    {...form.register(`documents.${idx}.documentCode`)}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Invoice copy"
                    {...form.register(`documents.${idx}.documentLabel`)}
                  />
                </div>
                <div className="col-span-6 space-y-1">
                  <Label className="text-xs text-muted-foreground">File (PDF / Word)</Label>
                  {form.watch(`documents.${idx}.fileName`) ? (
                    <div className="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2 text-xs">
                      <Paperclip className="h-3 w-3 shrink-0 text-primary" />
                      <span className="flex-1 truncate text-foreground font-medium">
                        {form.watch(`documents.${idx}.fileName`)}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          form.setValue(`documents.${idx}.fileName`, '');
                          form.setValue(`documents.${idx}.fileUrl`, '');
                          form.setValue(`documents.${idx}.mimeType`, '');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span>{uploadingDocIdx === idx ? 'Uploading…' : 'Choose PDF or Word file…'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingDocIdx(idx);
                          try {
                            const result = await api.upload(file);
                            form.setValue(`documents.${idx}.fileName`, result.fileName, { shouldValidate: true });
                            form.setValue(`documents.${idx}.fileUrl`, result.url, { shouldValidate: true });
                            form.setValue(`documents.${idx}.mimeType`, file.type);
                          } catch {
                            notify.error('Upload failed');
                          } finally {
                            setUploadingDocIdx(-1);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  )}
                  {(form.formState.errors.documents?.[idx]?.fileName ||
                    form.formState.errors.documents?.[idx]?.fileUrl) && (
                    <p className="text-xs text-destructive">File required</p>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-destructive/10"
                    onClick={() => removeDoc(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          The request will be saved as a <strong>Draft</strong> and can be reviewed before submission.
        </p>
        <Button type="submit" disabled={submitting} className="min-w-32">
          {submitting ? 'Saving…' : 'Save as Draft'}
        </Button>
      </div>
    </form>
  );
}
