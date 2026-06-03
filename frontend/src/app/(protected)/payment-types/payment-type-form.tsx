'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api';
import type { LegalEntity, Paginated, PaymentCategory, PaymentType, Role } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

export const paymentTypeSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE'),
  name: z.string().min(2).max(100),
  description: z.string().optional().or(z.literal('')),
  paymentCategoryId: z.string().uuid().optional().or(z.literal('')),
  legalEntityId: z.string().uuid('Select a legal entity'),
  makerRoleIds: z.array(z.string().uuid()).default([]),
  checkerRoleId: z.string().uuid().optional().or(z.literal('')),
  direction: z.enum(['OUTGOING', 'INCOMING']),
  requiresApprovalChain: z.boolean().optional(),
  isBatchBased: z.boolean().optional(),
  isConfidential: z.boolean().optional(),
  mobileInitiationOnly: z.boolean().optional(),
  allowsCrossCurrency: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type PaymentTypeFormData = z.infer<typeof paymentTypeSchema>;

interface Props {
  defaultValues?: Partial<PaymentType>;
  onSubmit: (data: PaymentTypeFormData) => void | Promise<void>;
  submitting?: boolean;
}

export function PaymentTypeForm({
  defaultValues,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentTypeFormData>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      paymentCategoryId: defaultValues?.paymentCategoryId ?? '',
      legalEntityId: defaultValues?.legalEntityId ?? '',
      makerRoleIds:
        defaultValues?.makerRoleIds ??
        (defaultValues?.makerRoleId ? [defaultValues.makerRoleId] : []),
      checkerRoleId: defaultValues?.checkerRoleId ?? '',
      direction: (defaultValues?.direction ?? 'OUTGOING') as 'OUTGOING' | 'INCOMING',
      requiresApprovalChain: defaultValues?.requiresApprovalChain ?? true,
      isBatchBased: defaultValues?.isBatchBased ?? false,
      isConfidential: defaultValues?.isConfidential ?? false,
      mobileInitiationOnly: defaultValues?.mobileInitiationOnly ?? false,
      allowsCrossCurrency: defaultValues?.allowsCrossCurrency ?? true,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['payment-categories-all'],
    queryFn: () => api.get<Paginated<PaymentCategory>>('/payment-categories?page=1&limit=200'),
  });
  const categoryOptions = (categories?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.name, value: c.id }));

  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
  });
  const legalEntityOptions = (legalEntities?.data ?? [])
    .filter((le) => le.isActive)
    .map((le) => ({ label: `${le.code} — ${le.name}`, value: le.id }));

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });
  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }));

  const makerRoleIds = watch('makerRoleIds') ?? [];

  const isSystem = defaultValues?.isSystem ?? false;

  const submit = handleSubmit((d) =>
    onSubmit({
      ...d,
      paymentCategoryId: d.paymentCategoryId ? d.paymentCategoryId : undefined,
      makerRoleIds: d.makerRoleIds ?? [],
      checkerRoleId: d.checkerRoleId ? d.checkerRoleId : undefined,
    }),
  );

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
          <Input id="code" placeholder="VENDOR_PAYMENT" disabled={isSystem} {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          {isSystem && <p className="text-xs text-muted-foreground">System code is locked.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="Vendor Payment" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentCategoryId">Payment category</Label>
          <Select
            id="paymentCategoryId"
            placeholder="Select category"
            options={[{ label: '— None —', value: '' }, ...categoryOptions]}
            {...register('paymentCategoryId')}
          />
          {errors.paymentCategoryId && <p className="text-xs text-destructive">{errors.paymentCategoryId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="direction">Direction <span className="text-destructive">*</span></Label>
          <Select
            id="direction"
            options={[
              { label: 'Outgoing (payment)', value: 'OUTGOING' },
              { label: 'Incoming (receipt)', value: 'INCOMING' },
            ]}
            {...register('direction')}
          />
          {errors.direction && <p className="text-xs text-destructive">{errors.direction.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="legalEntityId">Legal entity <span className="text-destructive">*</span></Label>
        <Select
          id="legalEntityId"
          placeholder="Select legal entity"
          options={legalEntityOptions}
          {...register('legalEntityId')}
        />
        {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Payment request creator roles (Maker)</Label>
        <p className="text-xs text-muted-foreground">
          Select one or more roles. Any user holding one of these may create requests for this payment type.
        </p>
        {roleOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No roles available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
            {roleOptions.map((r) => {
              const selected = makerRoleIds.includes(r.value);
              return (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={selected}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...makerRoleIds, r.value]
                        : makerRoleIds.filter((id) => id !== r.value);
                      setValue('makerRoleIds', next, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                  <span>{r.label}</span>
                </label>
              );
            })}
          </div>
        )}
        {errors.makerRoleIds && <p className="text-xs text-destructive">{errors.makerRoleIds.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkerRoleId">Payment request checker role</Label>
        <Select
          id="checkerRoleId"
          placeholder="Select Checker role"
          options={[{ label: '— None —', value: '' }, ...roleOptions]}
          {...register('checkerRoleId')}
        />
        {errors.checkerRoleId && <p className="text-xs text-destructive">{errors.checkerRoleId.message}</p>}
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <p className="text-sm font-medium">Workflow behaviour</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('requiresApprovalChain')} />
            <span>Requires approval chain</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('isBatchBased')} />
            <span>Batch-based (e.g. payroll)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('isConfidential')} />
            <span>Confidential (chairman-style)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('mobileInitiationOnly')} />
            <span>Mobile initiation only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('allowsCrossCurrency')} />
            <span>Allows cross-currency</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('isActive')} />
            <span>Active</span>
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
