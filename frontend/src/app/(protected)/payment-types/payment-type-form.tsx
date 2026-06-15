'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { PaymentType } from '@/types/domain';

const documentPolicySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Uppercase alphanumeric only'),
  label: z.string().min(1).max(120),
  required: z.boolean(),
  amountThresholdMinor: z
    .union([z.literal('').transform(() => null), z.coerce.number().int().min(0)])
    .nullable()
    .optional(),
  currencyCode: z
    .union([z.literal('').transform(() => null), z.string().length(3)])
    .nullable()
    .optional(),
});

const fieldConfigSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'camelCase / snake_case identifier'),
  label: z.string().min(1).max(120),
  visible: z.boolean(),
  required: z.boolean(),
  readOnly: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  helpText: z.string().max(500).optional().or(z.literal('')),
});

export const paymentTypeSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_]+$/, 'Uppercase alphanumeric only'),
    name: z.string().min(2).max(120),
    description: z.string().max(2000).optional().or(z.literal('')),
    direction: z.enum(['OUTGOING', 'INCOMING']),
    requiresApprovalChain: z.boolean(),
    isBatchBased: z.boolean(),
    isConfidential: z.boolean(),
    mobileInitiationOnly: z.boolean(),
    allowsCrossCurrency: z.boolean(),
    isActive: z.boolean(),
    documentPolicy: z.array(documentPolicySchema),
    fieldConfig: z.array(fieldConfigSchema),
  })
  .refine((v) => !(v.isConfidential && v.requiresApprovalChain), {
    message: 'Confidential types cannot require a standard approval chain',
    path: ['requiresApprovalChain'],
  });

export type PaymentTypeFormData = z.infer<typeof paymentTypeSchema>;

interface Props {
  defaultValues?: Partial<PaymentType>;
  onSubmit: (data: PaymentTypeFormData) => void | Promise<void>;
  submitting?: boolean;
  /** Code is immutable after creation. */
  codeLocked?: boolean;
}

export function PaymentTypeForm({
  defaultValues,
  onSubmit,
  submitting,
  codeLocked,
}: Props): React.ReactElement {
  const form = useForm<PaymentTypeFormData>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      direction: defaultValues?.direction ?? 'OUTGOING',
      requiresApprovalChain: defaultValues?.requiresApprovalChain ?? true,
      isBatchBased: defaultValues?.isBatchBased ?? false,
      isConfidential: defaultValues?.isConfidential ?? false,
      mobileInitiationOnly: defaultValues?.mobileInitiationOnly ?? false,
      allowsCrossCurrency: defaultValues?.allowsCrossCurrency ?? true,
      isActive: defaultValues?.isActive ?? true,
      documentPolicy: (defaultValues?.documentPolicy ?? []).map((d) => ({
        code: d.code,
        label: d.label,
        required: d.required,
        amountThresholdMinor: d.amountThresholdMinor ?? null,
        currencyCode: d.currencyCode ?? null,
      })),
      fieldConfig: (defaultValues?.fieldConfig ?? []).map((f) => ({
        key: f.key,
        label: f.label,
        visible: f.visible,
        required: f.required,
        readOnly: f.readOnly,
        sortOrder: f.sortOrder,
        helpText: f.helpText ?? '',
      })),
    },
  });
  const { register, handleSubmit, control, formState } = form;
  const { errors } = formState;

  const docs = useFieldArray({ control, name: 'documentPolicy' });
  const fields = useFieldArray({ control, name: 'fieldConfig' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-h-[80vh] space-y-6 overflow-y-auto pr-2">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            placeholder="VENDOR_PAYMENT"
            disabled={codeLocked}
            {...register('code')}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select
            id="direction"
            options={[
              { label: 'Outgoing', value: 'OUTGOING' },
              { label: 'Incoming', value: 'INCOMING' },
            ]}
            {...register('direction')}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Workflow behaviour</h3>
        <div className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-2">
          <CheckboxRow
            id="requiresApprovalChain"
            label="Requires approval chain"
            description="Routes through the per-type matrix (Section 1.5)."
            {...register('requiresApprovalChain')}
          />
          <CheckboxRow
            id="isBatchBased"
            label="Batch-based"
            description="Approval is given at batch level (payroll)."
            {...register('isBatchBased')}
          />
          <CheckboxRow
            id="isConfidential"
            label="Confidential"
            description="Beneficiary identity is suppressed outside the payments team."
            {...register('isConfidential')}
          />
          <CheckboxRow
            id="mobileInitiationOnly"
            label="Mobile initiation only"
            description="Initiation permitted only from the mobile app."
            {...register('mobileInitiationOnly')}
          />
          <CheckboxRow
            id="allowsCrossCurrency"
            label="Allows cross-currency"
            description="Maker may pick a current account in another currency."
            {...register('allowsCrossCurrency')}
          />
          <CheckboxRow id="isActive" label="Active" {...register('isActive')} />
        </div>
        {errors.requiresApprovalChain?.message && (
          <p className="mt-2 text-xs text-destructive">
            {errors.requiresApprovalChain.message}
          </p>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Document-attachment policy</h3>
            <p className="text-xs text-muted-foreground">
              Mandatory and threshold-gated attachments enforced at request creation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              docs.append({
                code: '',
                label: '',
                required: true,
                amountThresholdMinor: null,
                currencyCode: null,
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add document
          </Button>
        </div>
        {docs.fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No documents configured.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 items-end gap-2 rounded-md border p-2">
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Code</Label>
                  <Input placeholder="INVOICE_PDF" {...register(`documentPolicy.${i}.code`)} />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input placeholder="Invoice PDF" {...register(`documentPolicy.${i}.label`)} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Threshold (minor)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="—"
                    {...register(`documentPolicy.${i}.amountThresholdMinor`)}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Ccy</Label>
                  <Input placeholder="USD" maxLength={3} {...register(`documentPolicy.${i}.currencyCode`)} />
                </div>
                <div className="col-span-1 flex items-center pb-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      {...register(`documentPolicy.${i}.required`)}
                    />
                    Req
                  </label>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" size="icon" variant="ghost" onClick={() => docs.remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Field-level configuration</h3>
            <p className="text-xs text-muted-foreground">
              Controls field visibility, required and read-only status on the request form.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              fields.append({
                key: '',
                label: '',
                visible: true,
                required: false,
                readOnly: false,
                sortOrder: (fields.fields.length + 1) * 10,
                helpText: '',
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add field
          </Button>
        </div>
        {fields.fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No fields configured.
          </p>
        ) : (
          <div className="space-y-2">
            {fields.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 items-end gap-2 rounded-md border p-2">
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Key</Label>
                  <Input placeholder="invoiceNumber" {...register(`fieldConfig.${i}.key`)} />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input placeholder="Invoice Number" {...register(`fieldConfig.${i}.label`)} />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Order</Label>
                  <Input type="number" min={0} {...register(`fieldConfig.${i}.sortOrder`)} />
                </div>
                <div className="col-span-3 flex items-center gap-3 pb-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" className="h-4 w-4" {...register(`fieldConfig.${i}.visible`)} />
                    Visible
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" className="h-4 w-4" {...register(`fieldConfig.${i}.required`)} />
                    Required
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" className="h-4 w-4" {...register(`fieldConfig.${i}.readOnly`)} />
                    Read-only
                  </label>
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Help</Label>
                  <Input placeholder="—" {...register(`fieldConfig.${i}.helpText`)} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" size="icon" variant="ghost" onClick={() => fields.remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface CheckboxRowProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  description?: string;
}

const CheckboxRow = React.forwardRef<HTMLInputElement, CheckboxRowProps>(
  ({ id, label, description, ...rest }, ref) => (
    <label htmlFor={id} className="flex items-start gap-2 rounded-sm p-1 text-sm">
      <input ref={ref} id={id} type="checkbox" className="mt-0.5 h-4 w-4" {...rest} />
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  ),
);
CheckboxRow.displayName = 'CheckboxRow';
