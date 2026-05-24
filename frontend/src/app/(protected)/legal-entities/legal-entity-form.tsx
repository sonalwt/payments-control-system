'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Currency, Group, LegalEntity, Paginated } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

export const legalEntitySchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric'),
  registeredCountry: z.string().regex(/^[A-Z]{2}$/, 'ISO alpha-2'),
  baseCurrencyId: z.string().uuid(),
  taxIdentifier: z.string().max(50).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
export type LegalEntityFormData = z.infer<typeof legalEntitySchema>;

interface Props {
  defaultValues?: Partial<LegalEntity>;
  onSubmit: (data: LegalEntityFormData) => void | Promise<void>;
  submitting?: boolean;
}

export function LegalEntityForm({
  defaultValues,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const { data: groups } = useQuery({
    queryKey: ['groups-all'],
    queryFn: () => api.get<Paginated<Group>>('/groups?page=1&limit=100'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const currencyOptions = (currencies?.data ?? []).map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  }));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LegalEntityFormData>({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      groupId: defaultValues?.groupId ?? '',
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      registeredCountry: defaultValues?.registeredCountry ?? '',
      baseCurrencyId: defaultValues?.baseCurrencyId ?? '',
      taxIdentifier: defaultValues?.taxIdentifier ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupId">Group</Label>
        <Select
          id="groupId"
          placeholder="Select a group"
          options={(groups?.data ?? []).map((g) => ({ label: g.name, value: g.id }))}
          {...register('groupId')}
        />
        {errors.groupId && <p className="text-xs text-destructive">{errors.groupId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registeredCountry">Registered country (ISO)</Label>
          <Input
            id="registeredCountry"
            maxLength={2}
            placeholder="IN"
            {...register('registeredCountry')}
          />
          {errors.registeredCountry && (
            <p className="text-xs text-destructive">{errors.registeredCountry.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseCurrencyId">Base currency</Label>
          <Select
            id="baseCurrencyId"
            placeholder="Select"
            options={currencyOptions}
            {...register('baseCurrencyId')}
          />
          {errors.baseCurrencyId && (
            <p className="text-xs text-destructive">{errors.baseCurrencyId.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxIdentifier">Tax identifier</Label>
        <Input id="taxIdentifier" {...register('taxIdentifier')} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
