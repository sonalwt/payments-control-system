'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Currency,
  Employee,
  LegalEntity,
  Paginated,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

export const employeeSchema = z.object({
  employeeCode: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[A-Za-z0-9._/-]+$/, 'Letters, digits and . _ / - only'),
  fullName: z.string().min(1).max(150),
  preferredName: z.string().max(150).optional().or(z.literal('')),
  workEmail: z
    .string()
    .email('Invalid email')
    .max(254)
    .optional()
    .or(z.literal('')),
  legalEntityId: z.string().uuid('Select an employing entity'),
  countryCode: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2 (e.g. SG, IN)'),
  baseCurrencyId: z.string().uuid('Select a base currency'),
  payrollCategory: z.string().min(1).max(40),
  employmentStartDate: z.string().optional().or(z.literal('')),
  employmentEndDate: z.string().optional().or(z.literal('')),
  nationalId: z.string().max(60).optional().or(z.literal('')),
  taxIdentifier: z.string().max(60).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  compensationBand: z.string().max(40).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

const CATEGORY_OPTIONS = [
  { label: 'Staff', value: 'STAFF' },
  { label: 'Executive', value: 'EXEC' },
  { label: 'Contractor', value: 'CONTRACTOR' },
  { label: 'Intern', value: 'INTERN' },
];

interface Props {
  defaultValues?: Partial<Employee>;
  identityLocked?: boolean;
  onSubmit: (data: EmployeeFormData) => void | Promise<void>;
  submitting?: boolean;
}

export function EmployeeForm({
  defaultValues,
  identityLocked,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const { data: entities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () =>
      api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=100'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Currency[]>('/currencies'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: defaultValues?.employeeCode ?? '',
      fullName: defaultValues?.fullName ?? '',
      preferredName: defaultValues?.preferredName ?? '',
      workEmail: defaultValues?.workEmail ?? '',
      legalEntityId: defaultValues?.legalEntityId ?? '',
      countryCode: defaultValues?.countryCode ?? '',
      baseCurrencyId: defaultValues?.baseCurrencyId ?? '',
      payrollCategory: defaultValues?.payrollCategory ?? 'STAFF',
      employmentStartDate: defaultValues?.employmentStartDate ?? '',
      employmentEndDate: defaultValues?.employmentEndDate ?? '',
      nationalId: defaultValues?.nationalId ?? '',
      taxIdentifier: defaultValues?.taxIdentifier ?? '',
      dateOfBirth: defaultValues?.dateOfBirth ?? '',
      compensationBand: defaultValues?.compensationBand ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const entityOptions = (entities?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  }));
  const currencyOptions = (currencies ?? []).map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-h-[80vh] space-y-6 overflow-y-auto pr-2"
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employeeCode">Employee code</Label>
          <Input
            id="employeeCode"
            placeholder="SG-0001"
            disabled={identityLocked}
            {...register('employeeCode')}
          />
          {errors.employeeCode && (
            <p className="text-xs text-destructive">
              {errors.employeeCode.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            placeholder="Aishwarya Nair"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredName">Preferred name</Label>
          <Input id="preferredName" {...register('preferredName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workEmail">Work email</Label>
          <Input id="workEmail" type="email" {...register('workEmail')} />
          {errors.workEmail && (
            <p className="text-xs text-destructive">{errors.workEmail.message}</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="legalEntityId">Employing legal entity</Label>
          <Select
            id="legalEntityId"
            placeholder="Select an entity"
            options={entityOptions}
            disabled={identityLocked}
            {...register('legalEntityId')}
          />
          {errors.legalEntityId && (
            <p className="text-xs text-destructive">
              {errors.legalEntityId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryCode">Country of employment (ISO)</Label>
          <Input
            id="countryCode"
            placeholder="SG"
            maxLength={2}
            {...register('countryCode', {
              setValueAs: (v) => (typeof v === 'string' ? v.toUpperCase() : v),
            })}
          />
          {errors.countryCode && (
            <p className="text-xs text-destructive">
              {errors.countryCode.message}
            </p>
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
            <p className="text-xs text-destructive">
              {errors.baseCurrencyId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payrollCategory">Payroll category</Label>
          <Select
            id="payrollCategory"
            options={CATEGORY_OPTIONS}
            {...register('payrollCategory')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentStartDate">Start date</Label>
          <Input
            id="employmentStartDate"
            type="date"
            {...register('employmentStartDate')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentEndDate">End date</Label>
          <Input
            id="employmentEndDate"
            type="date"
            {...register('employmentEndDate')}
          />
        </div>
      </section>

      <section>
        <div className="mb-2">
          <h3 className="text-sm font-semibold">Sensitive payroll details</h3>
          <p className="text-xs text-muted-foreground">
            Masked by default in lists and detail views. Visible only to users
            holding the Payroll PII access permission (SOW §1.4, §15.2). Leave
            blank if not on file.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input id="nationalId" {...register('nationalId')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxIdentifier">Tax identifier</Label>
            <Input id="taxIdentifier" {...register('taxIdentifier')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compensationBand">Compensation band</Label>
            <Input
              id="compensationBand"
              placeholder="B3"
              {...register('compensationBand')}
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border p-3">
        <label htmlFor="isActive" className="flex items-start gap-2 text-sm">
          <input
            id="isActive"
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            {...register('isActive')}
          />
          <span>
            <span className="font-medium">Active</span>
            <span className="block text-xs text-muted-foreground">
              Inactive employees are excluded from payroll bulk uploads and from
              new reimbursement / FnF requests.
            </span>
          </span>
        </label>
      </section>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
