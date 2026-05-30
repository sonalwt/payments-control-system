'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Paginated, PaymentCategory, PaymentType, Role } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

const docSchema = z.object({
  code: z.string().min(1).max(40),
  label: z.string().min(1).max(100),
  required: z.boolean(),
});

export const paymentTypeSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE'),
  name: z.string().min(2).max(100),
  description: z.string().optional().or(z.literal('')),
  paymentCategoryId: z.string().uuid().optional().or(z.literal('')),
  makerRoleId: z.string().uuid().optional().or(z.literal('')),
  checkerRoleId: z.string().uuid().optional().or(z.literal('')),
  direction: z.enum(['OUTGOING', 'INCOMING']),
  requiresApprovalChain: z.boolean().optional(),
  isBatchBased: z.boolean().optional(),
  isConfidential: z.boolean().optional(),
  mobileInitiationOnly: z.boolean().optional(),
  allowsCrossCurrency: z.boolean().optional(),
  documentPolicy: z.array(docSchema).optional(),
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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentTypeFormData>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      paymentCategoryId: defaultValues?.paymentCategoryId ?? '',
      makerRoleId: defaultValues?.makerRoleId ?? '',
      checkerRoleId: defaultValues?.checkerRoleId ?? '',
      direction: (defaultValues?.direction ?? 'OUTGOING') as 'OUTGOING' | 'INCOMING',
      requiresApprovalChain: defaultValues?.requiresApprovalChain ?? true,
      isBatchBased: defaultValues?.isBatchBased ?? false,
      isConfidential: defaultValues?.isConfidential ?? false,
      mobileInitiationOnly: defaultValues?.mobileInitiationOnly ?? false,
      allowsCrossCurrency: defaultValues?.allowsCrossCurrency ?? true,
      documentPolicy:
        defaultValues?.documentPolicy?.map((d) => ({
          code: d.code,
          label: d.label,
          required: d.required,
        })) ?? [],
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documentPolicy',
  });

  const { data: categories } = useQuery({
    queryKey: ['payment-categories-all'],
    queryFn: () => api.get<Paginated<PaymentCategory>>('/payment-categories?page=1&limit=200'),
  });
  const categoryOptions = (categories?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.name, value: c.id }));

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });
  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }));

  const isSystem = defaultValues?.isSystem ?? false;

  const submit = handleSubmit((d) =>
    onSubmit({
      ...d,
      paymentCategoryId: d.paymentCategoryId ? d.paymentCategoryId : undefined,
      makerRoleId: d.makerRoleId ? d.makerRoleId : undefined,
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="makerRoleId">Payment request creator role (Maker)</Label>
          <Select
            id="makerRoleId"
            placeholder="Select Maker role"
            options={[{ label: '— None —', value: '' }, ...roleOptions]}
            {...register('makerRoleId')}
          />
          {errors.makerRoleId && <p className="text-xs text-destructive">{errors.makerRoleId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkerRoleId">Payment request checker role (Maker)</Label>
          <Select
            id="checkerRoleId"
            placeholder="Select Checker role"
            options={[{ label: '— None —', value: '' }, ...roleOptions]}
            {...register('checkerRoleId')}
          />
          {errors.checkerRoleId && <p className="text-xs text-destructive">{errors.checkerRoleId.message}</p>}
        </div>
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

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Document policy</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ code: '', label: '', required: true })}
          >
            <Plus className="mr-1 h-3 w-3" /> Add document
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents required.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                <div>
                  <Label className="text-xs">Code</Label>
                  <Input placeholder="INVOICE" {...register(`documentPolicy.${idx}.code`)} />
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input placeholder="Invoice PDF" {...register(`documentPolicy.${idx}.label`)} />
                </div>
                <label className="mb-2 flex items-center gap-1 text-xs">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" {...register(`documentPolicy.${idx}.required`)} />
                  Required
                </label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="mb-1"
                  onClick={() => remove(idx)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
