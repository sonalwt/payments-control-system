'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Country, Department, Employee, Paginated } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

export const employeeSchema = z.object({
  employeeCode: z.string().min(1).max(50),
  fullName: z.string().min(2).max(150),
  workEmail: z.string().email(),
  countryOfEmploymentId: z.string().uuid('Select a country'),
  departmentId: z.string().uuid('Select a department'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  nationalId: z.string().max(50).optional().or(z.literal('')),
  taxIdentifier: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  mobileNumber: z.string().max(30).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  compensationBand: z.string().max(20).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
export type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Props {
  defaultValues?: Partial<Employee>;
  onSubmit: (data: EmployeeFormData) => void | Promise<void>;
  submitting?: boolean;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  submitting,
}: Props): React.ReactElement {
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=200'),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => api.get<Paginated<Department>>('/departments?page=1&limit=200'),
  });

  const countryOptions = (countries?.data ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.code} — ${c.countryName}`, value: c.id }));
  const departmentOptions = (departments?.data ?? [])
    .filter((d) => d.isActive)
    .map((d) => ({ label: `${d.code} — ${d.name}`, value: d.id }));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: defaultValues?.employeeCode ?? '',
      fullName: defaultValues?.fullName ?? '',
      workEmail: defaultValues?.workEmail ?? '',
      countryOfEmploymentId: defaultValues?.countryOfEmploymentId ?? '',
      departmentId: defaultValues?.departmentId ?? '',
      startDate: defaultValues?.startDate ?? '',
      endDate: defaultValues?.endDate ?? '',
      nationalId: defaultValues?.nationalId ?? '',
      taxIdentifier: defaultValues?.taxIdentifier ?? '',
      dateOfBirth: defaultValues?.dateOfBirth ?? '',
      mobileNumber: defaultValues?.mobileNumber ?? '',
      address: defaultValues?.address ?? '',
      compensationBand: defaultValues?.compensationBand ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeCode">Employee code <span className="text-destructive">*</span></Label>
          <Input id="employeeCode" placeholder="EMP-001" {...register('employeeCode')} />
          {errors.employeeCode && <p className="text-xs text-destructive">{errors.employeeCode.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name <span className="text-destructive">*</span></Label>
          <Input id="fullName" placeholder="Jane Doe" {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="workEmail">Work email <span className="text-destructive">*</span></Label>
        <Input id="workEmail" type="email" placeholder="jane.doe@acme.com" {...register('workEmail')} />
        {errors.workEmail && <p className="text-xs text-destructive">{errors.workEmail.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="countryOfEmploymentId">Country of employment <span className="text-destructive">*</span></Label>
          <Select
            id="countryOfEmploymentId"
            placeholder="Select country"
            options={countryOptions}
            {...register('countryOfEmploymentId')}
          />
          {errors.countryOfEmploymentId && <p className="text-xs text-destructive">{errors.countryOfEmploymentId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department <span className="text-destructive">*</span></Label>
          <Select
            id="departmentId"
            placeholder="Select department"
            options={departmentOptions}
            {...register('departmentId')}
          />
          {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationalId">National ID</Label>
          <Input id="nationalId" {...register('nationalId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxIdentifier">Tax identifier</Label>
          <Input id="taxIdentifier" {...register('taxIdentifier')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile number</Label>
          <Input id="mobileNumber" placeholder="+91 90000 00000" {...register('mobileNumber')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...register('address')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compensationBand">Compensation band</Label>
        <Input id="compensationBand" placeholder="L4" {...register('compensationBand')} />
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
