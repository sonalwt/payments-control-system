'use client';

import { useForm, useFieldArray, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { todayInDubai } from '@/lib/datetime';
import type {
  ApprovalMatrix,
  Currency,
  Paginated,
  PaymentType,
  User,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

// Steps are now always USER-type, picking from users who hold the APPROVER
// role. The DB still accepts ROLE-type steps; legacy rows are preserved
// in storage but the editable UI requires a user pick on save.
const stepSchema = z.object({
  approverUserId: z.string().uuid('Select an approver user'),
  isOptional: z.boolean().optional(),
});

const bandSchema = z.object({
  minAmount: z.coerce.number().min(0),
  // A blank Max means "and above" (open-ended). z.literal('') is tried FIRST
  // because z.coerce.number() would otherwise coerce '' → 0, turning an
  // open-ended band into [0, 0] and failing the max > min check.
  maxAmount: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
});

export const approvalMatrixSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().or(z.literal('')),
  paymentTypeId: z.string().uuid('Select a payment type'),
  currencyId: z.string().uuid('Select a currency'),
  ttMode: z.enum(['ONLINE_TT', 'OFFLINE_TT'], { message: 'Select a TT mode' }),
  effectiveFrom: z.string().min(1, 'Required'),
  effectiveTo: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  bands: z.array(bandSchema).min(1, 'At least one band required'),
});
export type ApprovalMatrixFormData = z.infer<typeof approvalMatrixSchema>;

interface Props {
  defaultValues?: Partial<ApprovalMatrix>;
  onSubmit: (data: ApprovalMatrixFormData) => void | Promise<void>;
  submitting?: boolean;
}

function StepRow({
  bandIdx,
  stepIdx,
  userOptions,
  register,
  onRemove,
}: {
  bandIdx: number;
  stepIdx: number;
  userOptions: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded border p-2">
      <div>
        <Label className="text-xs">Approver</Label>
        <Select
          placeholder="Select approver user"
          options={userOptions}
          {...register(`bands.${bandIdx}.steps.${stepIdx}.approverUserId`)}
        />
      </div>
      <label className="mb-2 flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          {...register(`bands.${bandIdx}.steps.${stepIdx}.isOptional`)}
        />
        Optional
      </label>
      <Button type="button" size="icon" variant="ghost" className="mb-1" onClick={onRemove} title="Remove step">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function BandSection({
  control,
  bandIdx,
  userOptions,
  register,
  onRemoveBand,
}: {
  control: Control<ApprovalMatrixFormData>;
  bandIdx: number;
  userOptions: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  onRemoveBand: () => void;
}): React.ReactElement {
  const stepArr = useFieldArray({ control, name: `bands.${bandIdx}.steps` });
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs">Min amount</Label>
          <Input type="number" step="0.01" min={0} {...register(`bands.${bandIdx}.minAmount`)} />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Max amount <span className="text-muted-foreground font-normal">(blank = and above)</span></Label>
          <Input type="number" step="0.01" min={0} placeholder="and above" {...register(`bands.${bandIdx}.maxAmount`)} />
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemoveBand} title="Remove band">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Approval chain</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => stepArr.append({ approverUserId: '', isOptional: false })}
          >
            <Plus className="mr-1 h-3 w-3" /> Add step
          </Button>
        </div>
        {stepArr.fields.length === 0 ? (
          <p className="text-xs text-destructive">At least one step is required.</p>
        ) : (
          <div className="space-y-2">
            {stepArr.fields.map((f, i) => (
              <StepRow
                key={f.id}
                bandIdx={bandIdx}
                stepIdx={i}
                userOptions={userOptions}
                register={register}
                onRemove={() => stepArr.remove(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApprovalMatrixForm({
  defaultValues,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types-all'],
    queryFn: () => api.get<Paginated<PaymentType>>('/payment-types?page=1&limit=200'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  // §1.5 / §3 — matrix steps are USER-only, restricted to users who
  // hold the APPROVER role.
  const { data: users } = useQuery({
    queryKey: ['users-with-approver-role'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200&roleCode=APPROVER'),
  });
  const paymentTypeOptions = (paymentTypes?.data ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({ label: p.name, value: p.id }));
  const currencyOptions = (currencies?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.code ? `${c.code} — ${c.name}` : c.name, value: c.id }));
  const userOptions = (users?.data ?? [])
    .filter((u) => u.isActive)
    .map((u) => ({ label: `${u.fullName} (${u.email})`, value: u.id }));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ApprovalMatrixFormData>({
    resolver: zodResolver(approvalMatrixSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      paymentTypeId: defaultValues?.paymentTypeId ?? '',
      currencyId: defaultValues?.currencyId ?? '',
      ttMode: defaultValues?.ttMode ?? 'ONLINE_TT',
      effectiveFrom: defaultValues?.effectiveFrom ?? todayInDubai(),
      effectiveTo: defaultValues?.effectiveTo ?? '',
      isActive: defaultValues?.isActive ?? true,
      bands: defaultValues?.bands?.map((b) => ({
        minAmount: Number(b.minAmount),
        maxAmount: b.maxAmount == null ? '' : Number(b.maxAmount),
        // Legacy ROLE-type steps load with an empty user pick so the
        // editor must explicitly choose an APPROVER on save.
        steps: b.steps.map((s) => ({
          approverUserId: s.approverType === 'USER' ? (s.approverUserId ?? '') : '',
          isOptional: s.isOptional ?? false,
        })),
      })) ?? [
        { minAmount: 0, maxAmount: '', steps: [{ approverUserId: '', isOptional: false }] },
      ],
    },
  });

  const bandArr = useFieldArray({ control, name: 'bands' });

  function handleFormSubmit(d: ApprovalMatrixFormData) {
    const normalized = {
      ...d,
      effectiveTo: d.effectiveTo === '' ? undefined : d.effectiveTo,
      description: d.description === '' ? undefined : d.description,
      bands: d.bands.map((b) => ({
        minAmount: Number(b.minAmount),
        maxAmount: b.maxAmount === '' || b.maxAmount == null ? null : Number(b.maxAmount),
        // Every step is now USER-type; the user is required by the schema.
        steps: b.steps.map((s) => ({
          approverType: 'USER' as const,
          approverUserId: s.approverUserId,
          isOptional: s.isOptional ?? false,
        })),
      })),
    };
    return onSubmit(normalized as ApprovalMatrixFormData);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input id="name" placeholder="Trade Payments — USD" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentTypeId">Payment type <span className="text-destructive">*</span></Label>
          <Select
            id="paymentTypeId"
            placeholder="Select payment type"
            options={paymentTypeOptions}
            {...register('paymentTypeId')}
          />
          {errors.paymentTypeId && <p className="text-xs text-destructive">{errors.paymentTypeId.message}</p>}
        </div>
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="ttMode">Treasury mode (TT) <span className="text-destructive">*</span></Label>
        <Select
          id="ttMode"
          placeholder="Select TT mode"
          options={[
            { label: 'Online TT', value: 'ONLINE_TT' },
            { label: 'Offline TT', value: 'OFFLINE_TT' },
          ]}
          {...register('ttMode')}
        />
        <p className="text-xs text-muted-foreground">
          Determines which Treasury Team maker executes the payment after final approval.
        </p>
        {errors.ttMode && <p className="text-xs text-destructive">{errors.ttMode.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="effectiveFrom">Effective from <span className="text-destructive">*</span></Label>
          <Input id="effectiveFrom" type="date" {...register('effectiveFrom')} />
          {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="effectiveTo">Effective to</Label>
          <Input id="effectiveTo" type="date" {...register('effectiveTo')} />
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Bands & approval chain</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => bandArr.append({ minAmount: 0, maxAmount: '', steps: [{ approverUserId: '', isOptional: false }] })}
          >
            <Plus className="mr-1 h-3 w-3" /> Add band
          </Button>
        </div>
        {bandArr.fields.length === 0 ? (
          <p className="text-xs text-destructive">At least one band is required.</p>
        ) : (
          <div className="space-y-3">
            {bandArr.fields.map((f, i) => (
              <BandSection
                key={f.id}
                control={control}
                bandIdx={i}
                userOptions={userOptions}
                register={register}
                onRemoveBand={() => bandArr.remove(i)}
              />
            ))}
          </div>
        )}
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
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save (draft)'}
        </Button>
      </DialogFooter>
    </form>
  );
}
