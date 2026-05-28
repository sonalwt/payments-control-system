'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Country, LegalEntity, Paginated } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

export const legalEntitySchema = z.object({
  name: z.string().min(2).max(200),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, digits, underscore or hyphen'),
  countryId: z.string().uuid('Select a country'),
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
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=200'),
  });
  const countryOptions = (countries?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.code} — ${c.countryName}`, value: c.id }));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LegalEntityFormData>({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      countryId: defaultValues?.countryId ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
          <Input id="code" placeholder="ACME-IN" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryId">Country <span className="text-destructive">*</span></Label>
          <Select
            id="countryId"
            placeholder="Select country"
            options={countryOptions}
            {...register('countryId')}
          />
          {errors.countryId && <p className="text-xs text-destructive">{errors.countryId.message}</p>}
        </div>
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
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
