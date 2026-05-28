'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Counterparty, Country, Paginated } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

const TAX_TYPES = ['TRN', 'GSTIN', 'VAT', 'PAN', 'EIN', 'OTHER'] as const;

const taxSchema = z.object({
  type: z.enum(TAX_TYPES),
  value: z.string().min(1).max(50),
  label: z.string().max(60).optional().or(z.literal('')),
});

const addressSchema = z.object({
  label: z.string().min(1).max(60),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  isPrimary: z.boolean(),
});

export const counterpartySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, digits, underscore or hyphen'),
  name: z.string().min(2).max(200),
  legalName: z.string().max(200).optional().or(z.literal('')),
  role: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']),
  countryId: z.string().uuid().optional().or(z.literal('')),
  taxIdentifiers: z.array(taxSchema).optional(),
  addresses: z.array(addressSchema).optional(),
  primaryContactName: z.string().max(150).optional().or(z.literal('')),
  primaryContactEmail: z.string().email().optional().or(z.literal('')),
  primaryContactPhone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  kycDone: z.boolean().optional(),
});
export type CounterpartyFormData = z.infer<typeof counterpartySchema>;

interface Props {
  defaultValues?: Partial<Counterparty>;
  onSubmit: (data: CounterpartyFormData) => void | Promise<void>;
  submitting?: boolean;
}

export function CounterpartyForm({
  defaultValues,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=200'),
  });
  const countryOptions = (countries?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.code} — ${c.countryName}`, value: c.id }));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CounterpartyFormData>({
    resolver: zodResolver(counterpartySchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      legalName: defaultValues?.legalName ?? '',
      role: (defaultValues?.role ?? 'VENDOR') as 'VENDOR' | 'CUSTOMER' | 'BOTH',
      countryId: defaultValues?.countryId ?? '',
      taxIdentifiers: defaultValues?.taxIdentifiers?.map((t) => ({
        type: t.type,
        value: t.value,
        label: t.label ?? '',
      })) ?? [],
      addresses: defaultValues?.addresses?.map((a) => ({
        label: a.label,
        line1: a.line1,
        line2: a.line2 ?? '',
        city: a.city,
        state: a.state ?? '',
        postalCode: a.postalCode ?? '',
        isPrimary: a.isPrimary,
      })) ?? [],
      primaryContactName: defaultValues?.primaryContactName ?? '',
      primaryContactEmail: defaultValues?.primaryContactEmail ?? '',
      primaryContactPhone: defaultValues?.primaryContactPhone ?? '',
      notes: defaultValues?.notes ?? '',
      isActive: defaultValues?.isActive ?? true,
      kycDone: defaultValues?.kycDone ?? false,
    },
  });

  const taxFields = useFieldArray({ control, name: 'taxIdentifiers' });
  const addrFields = useFieldArray({ control, name: 'addresses' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
          <Input id="code" placeholder="CP-0001" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
          <Select
            id="role"
            options={[
              { label: 'Vendor', value: 'VENDOR' },
              { label: 'Customer', value: 'CUSTOMER' },
              { label: 'Both', value: 'BOTH' },
            ]}
            {...register('role')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="Acme Supplies" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalName">Legal / registered name</Label>
          <Input id="legalName" placeholder="Acme Supplies Pvt Ltd" {...register('legalName')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="countryId">Country</Label>
        <Select
          id="countryId"
          placeholder="Select country"
          options={countryOptions}
          {...register('countryId')}
        />
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <p className="text-sm font-medium">Primary contact</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="primaryContactName" className="text-xs">Name</Label>
            <Input id="primaryContactName" {...register('primaryContactName')} />
          </div>
          <div>
            <Label htmlFor="primaryContactEmail" className="text-xs">Email</Label>
            <Input id="primaryContactEmail" type="email" {...register('primaryContactEmail')} />
            {errors.primaryContactEmail && <p className="text-xs text-destructive">{errors.primaryContactEmail.message}</p>}
          </div>
          <div>
            <Label htmlFor="primaryContactPhone" className="text-xs">Phone</Label>
            <Input id="primaryContactPhone" {...register('primaryContactPhone')} />
          </div>
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Tax identifiers</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => taxFields.append({ type: 'GSTIN', value: '', label: '' })}
          >
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {taxFields.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tax identifiers.</p>
        ) : (
          <div className="space-y-2">
            {taxFields.fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[120px_1fr_1fr_auto] gap-2 items-end">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    options={TAX_TYPES.map((t) => ({ label: t, value: t }))}
                    {...register(`taxIdentifiers.${idx}.type`)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input placeholder="29ABCDE1234F1Z5" {...register(`taxIdentifiers.${idx}.value`)} />
                </div>
                <div>
                  <Label className="text-xs">Label (optional)</Label>
                  <Input {...register(`taxIdentifiers.${idx}.label`)} />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="mb-1"
                  onClick={() => taxFields.remove(idx)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Addresses</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addrFields.append({
              label: 'Registered office',
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              isPrimary: addrFields.fields.length === 0,
            })}
          >
            <Plus className="mr-1 h-3 w-3" /> Add address
          </Button>
        </div>
        {addrFields.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No addresses.</p>
        ) : (
          <div className="space-y-3">
            {addrFields.fields.map((f, idx) => (
              <div key={f.id} className="rounded border p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <Label className="text-xs">Label</Label>
                    <Input placeholder="Registered office" {...register(`addresses.${idx}.label`)} />
                  </div>
                  <label className="ml-2 flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      {...register(`addresses.${idx}.isPrimary`)}
                    />
                    Primary
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => addrFields.remove(idx)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Input placeholder="Line 1" {...register(`addresses.${idx}.line1`)} />
                <Input placeholder="Line 2 (optional)" {...register(`addresses.${idx}.line2`)} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="City" {...register(`addresses.${idx}.city`)} />
                  <Input placeholder="State / region" {...register(`addresses.${idx}.state`)} />
                  <Input placeholder="Postal code" {...register(`addresses.${idx}.postalCode`)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...register('notes')} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            {...register('isActive')}
          />
          <span className="text-sm">Active</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            {...register('kycDone')}
          />
          <span className="text-sm">KYC done?</span>
        </label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
