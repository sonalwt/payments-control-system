'use client';

import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  ApprovalMatrix,
  Currency,
  Paginated,
  PaymentType,
  Role,
  User,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

const stepSchema = z.object({
  approverType: z.enum(['USER', 'ROLE']),
  approverUserId: z.string().uuid().optional().or(z.literal('')),
  approverRoleId: z.string().uuid().optional().or(z.literal('')),
  isOptional: z.boolean().optional(),
});

const bandSchema = z.object({
  minAmount: z.coerce.number().min(0),
  maxAmount: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
});

export const approvalMatrixSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().or(z.literal('')),
  paymentTypeId: z.string().uuid('Select a payment type'),
  currencyId: z.string().uuid('Select a currency'),
  version: z.coerce.number().int().min(1).optional(),
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
  control,
  bandIdx,
  stepIdx,
  userOptions,
  roleOptions,
  register,
  onRemove,
}: {
  control: Control<ApprovalMatrixFormData>;
  bandIdx: number;
  stepIdx: number;
  userOptions: { label: string; value: string }[];
  roleOptions: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  onRemove: () => void;
}): React.ReactElement {
  const approverType = useWatch({
    control,
    name: `bands.${bandIdx}.steps.${stepIdx}.approverType`,
  });
  return (
    <div className="grid grid-cols-[110px_1fr_auto_auto] items-end gap-2 rounded border p-2">
      <div>
        <Label className="text-xs">Type</Label>
        <Select
          options={[
            { label: 'User', value: 'USER' },
            { label: 'Role', value: 'ROLE' },
          ]}
          {...register(`bands.${bandIdx}.steps.${stepIdx}.approverType`)}
        />
      </div>
      <div>
        <Label className="text-xs">{approverType === 'ROLE' ? 'Role' : 'User'}</Label>
        {approverType === 'ROLE' ? (
          <Select
            placeholder="Select role"
            options={roleOptions}
            {...register(`bands.${bandIdx}.steps.${stepIdx}.approverRoleId`)}
          />
        ) : (
          <Select
            placeholder="Select user"
            options={userOptions}
            {...register(`bands.${bandIdx}.steps.${stepIdx}.approverUserId`)}
          />
        )}
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
  roleOptions,
  register,
  onRemoveBand,
}: {
  control: Control<ApprovalMatrixFormData>;
  bandIdx: number;
  userOptions: { label: string; value: string }[];
  roleOptions: { label: string; value: string }[];
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
            onClick={() => stepArr.append({ approverType: 'ROLE', approverUserId: '', approverRoleId: '', isOptional: false })}
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
                control={control}
                bandIdx={bandIdx}
                stepIdx={i}
                userOptions={userOptions}
                roleOptions={roleOptions}
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
  const { data: users } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200'),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
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
  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }));

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
      version: defaultValues?.version ?? 1,
      effectiveFrom: defaultValues?.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      effectiveTo: defaultValues?.effectiveTo ?? '',
      isActive: defaultValues?.isActive ?? true,
      bands: defaultValues?.bands?.map((b) => ({
        minAmount: Number(b.minAmount),
        maxAmount: b.maxAmount == null ? '' : Number(b.maxAmount),
        steps: b.steps.map((s) => ({
          approverType: s.approverType,
          approverUserId: s.approverUserId ?? '',
          approverRoleId: s.approverRoleId ?? '',
          isOptional: s.isOptional ?? false,
        })),
      })) ?? [
        { minAmount: 0, maxAmount: '', steps: [{ approverType: 'ROLE', approverUserId: '', approverRoleId: '', isOptional: false }] },
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
        steps: b.steps.map((s) => ({
          approverType: s.approverType,
          approverUserId: s.approverType === 'USER' ? (s.approverUserId || undefined) : undefined,
          approverRoleId: s.approverType === 'ROLE' ? (s.approverRoleId || undefined) : undefined,
          isOptional: s.isOptional ?? false,
        })),
      })),
    };
    return onSubmit(normalized as ApprovalMatrixFormData);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="Trade Payments — USD" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input id="version" type="number" min={1} {...register('version')} />
        </div>
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
            onClick={() => bandArr.append({ minAmount: 0, maxAmount: '', steps: [{ approverType: 'ROLE', approverUserId: '', approverRoleId: '', isOptional: false }] })}
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
                roleOptions={roleOptions}
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
