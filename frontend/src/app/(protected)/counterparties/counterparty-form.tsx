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
import type { Counterparty } from '@/types/domain';

const taxIdSchema = z.object({
  type: z.enum(['TRN', 'GSTIN', 'VAT', 'PAN', 'EIN', 'OTHER']),
  value: z.string().min(1).max(60),
  label: z.string().max(80).optional().or(z.literal('')),
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

export const counterpartySchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric (_ or - allowed)'),
    name: z.string().min(2).max(200),
    legalName: z.string().max(200).optional().or(z.literal('')),
    role: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']),
    countryCode: z
      .string()
      .length(2)
      .regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2 (e.g. SG, IN)'),
    taxIdentifiers: z.array(taxIdSchema),
    addresses: z.array(addressSchema),
    primaryContactName: z.string().max(150).optional().or(z.literal('')),
    primaryContactEmail: z
      .string()
      .email('Invalid email')
      .max(150)
      .optional()
      .or(z.literal('')),
    primaryContactPhone: z.string().max(50).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
    isActive: z.boolean(),
  })
  .refine(
    (v) =>
      v.addresses.length === 0 ||
      v.addresses.filter((a) => a.isPrimary).length === 1,
    {
      message: 'Exactly one address must be marked primary',
      path: ['addresses'],
    },
  );

export type CounterpartyFormData = z.infer<typeof counterpartySchema>;

interface Props {
  defaultValues?: Partial<Counterparty>;
  onSubmit: (data: CounterpartyFormData) => void | Promise<void>;
  submitting?: boolean;
  codeLocked?: boolean;
}

export function CounterpartyForm({
  defaultValues,
  onSubmit,
  submitting,
  codeLocked,
}: Props): React.ReactElement {
  const form = useForm<CounterpartyFormData>({
    resolver: zodResolver(counterpartySchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      legalName: defaultValues?.legalName ?? '',
      role: defaultValues?.role ?? 'VENDOR',
      countryCode: defaultValues?.countryCode ?? '',
      taxIdentifiers: (defaultValues?.taxIdentifiers ?? []).map((t) => ({
        type: t.type,
        value: t.value,
        label: t.label ?? '',
      })),
      addresses: (defaultValues?.addresses ?? []).map((a) => ({
        label: a.label,
        line1: a.line1,
        line2: a.line2 ?? '',
        city: a.city,
        state: a.state ?? '',
        postalCode: a.postalCode ?? '',
        isPrimary: a.isPrimary,
      })),
      primaryContactName: defaultValues?.primaryContactName ?? '',
      primaryContactEmail: defaultValues?.primaryContactEmail ?? '',
      primaryContactPhone: defaultValues?.primaryContactPhone ?? '',
      notes: defaultValues?.notes ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });
  const { register, handleSubmit, control, formState, setValue, watch } = form;
  const { errors } = formState;

  const taxIds = useFieldArray({ control, name: 'taxIdentifiers' });
  const addrs = useFieldArray({ control, name: 'addresses' });
  const addresses = watch('addresses');

  const setPrimaryAddress = (index: number): void => {
    addresses.forEach((_, i) => {
      setValue(`addresses.${i}.isPrimary`, i === index, {
        shouldDirty: true,
      });
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-h-[80vh] space-y-6 overflow-y-auto pr-2"
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            placeholder="ACME_LTD"
            disabled={codeLocked}
            {...register('code')}
          />
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" placeholder="Acme Ltd" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="legalName">Registered legal name</Label>
          <Input
            id="legalName"
            placeholder="Acme Trading Private Limited"
            {...register('legalName')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
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
        <div className="space-y-2">
          <Label htmlFor="countryCode">Country (ISO alpha-2)</Label>
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
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Tax identifiers</h3>
            <p className="text-xs text-muted-foreground">
              TRN, GSTIN, VAT registration, etc. — as applicable to the
              counterparty&apos;s jurisdiction.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              taxIds.append({ type: 'OTHER', value: '', label: '' })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add identifier
          </Button>
        </div>
        {taxIds.fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No tax identifiers recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {taxIds.fields.map((f, i) => (
              <div
                key={f.id}
                className="grid grid-cols-12 items-end gap-2 rounded-md border p-2"
              >
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    options={[
                      { label: 'TRN', value: 'TRN' },
                      { label: 'GSTIN', value: 'GSTIN' },
                      { label: 'VAT', value: 'VAT' },
                      { label: 'PAN', value: 'PAN' },
                      { label: 'EIN', value: 'EIN' },
                      { label: 'Other', value: 'OTHER' },
                    ]}
                    {...register(`taxIdentifiers.${i}.type`)}
                  />
                </div>
                <div className="col-span-5 space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input {...register(`taxIdentifiers.${i}.value`)} />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Label (for Other)</Label>
                  <Input {...register(`taxIdentifiers.${i}.label`)} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => taxIds.remove(i)}
                  >
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
            <h3 className="text-sm font-semibold">Addresses</h3>
            <p className="text-xs text-muted-foreground">
              Mark exactly one address as the primary registered address.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addrs.append({
                label: 'Registered Office',
                line1: '',
                line2: '',
                city: '',
                state: '',
                postalCode: '',
                isPrimary: addrs.fields.length === 0,
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add address
          </Button>
        </div>
        {addrs.fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No addresses recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {addrs.fields.map((f, i) => (
              <div key={f.id} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      placeholder="Registered Office"
                      {...register(`addresses.${i}.label`)}
                    />
                  </div>
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Line 1</Label>
                    <Input {...register(`addresses.${i}.line1`)} />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Line 2</Label>
                    <Input {...register(`addresses.${i}.line2`)} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input {...register(`addresses.${i}.city`)} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">State / Region</Label>
                    <Input {...register(`addresses.${i}.state`)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Postal code</Label>
                    <Input {...register(`addresses.${i}.postalCode`)} />
                  </div>
                  <div className="col-span-3 flex items-center gap-2 pb-1 pt-5">
                    <input
                      type="radio"
                      className="h-4 w-4"
                      name="primary-address"
                      checked={addresses?.[i]?.isPrimary === true}
                      onChange={() => setPrimaryAddress(i)}
                    />
                    <span className="text-xs">Primary</span>
                  </div>
                  <div className="col-span-1 flex items-end justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => addrs.remove(i)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.addresses?.message && (
          <p className="mt-2 text-xs text-destructive">
            {errors.addresses.message}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Primary contact</h3>
        <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="primaryContactName">Name</Label>
            <Input
              id="primaryContactName"
              {...register('primaryContactName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryContactEmail">Email</Label>
            <Input
              id="primaryContactEmail"
              type="email"
              {...register('primaryContactEmail')}
            />
            {errors.primaryContactEmail && (
              <p className="text-xs text-destructive">
                {errors.primaryContactEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryContactPhone">Phone</Label>
            <Input
              id="primaryContactPhone"
              {...register('primaryContactPhone')}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
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
              Inactive counterparties cannot be selected on new payment
              requests.
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
