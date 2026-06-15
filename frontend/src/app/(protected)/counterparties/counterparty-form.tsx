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

/** ISO 3166-1 alpha-2 country list — sorted alphabetically by name. */
const COUNTRIES: { label: string; value: string }[] = [
  { label: 'Afghanistan', value: 'AF' },
  { label: 'Albania', value: 'AL' },
  { label: 'Algeria', value: 'DZ' },
  { label: 'Angola', value: 'AO' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Armenia', value: 'AM' },
  { label: 'Australia', value: 'AU' },
  { label: 'Austria', value: 'AT' },
  { label: 'Azerbaijan', value: 'AZ' },
  { label: 'Bahrain', value: 'BH' },
  { label: 'Bangladesh', value: 'BD' },
  { label: 'Belarus', value: 'BY' },
  { label: 'Belgium', value: 'BE' },
  { label: 'Bolivia', value: 'BO' },
  { label: 'Bosnia and Herzegovina', value: 'BA' },
  { label: 'Brazil', value: 'BR' },
  { label: 'Bulgaria', value: 'BG' },
  { label: 'Cambodia', value: 'KH' },
  { label: 'Cameroon', value: 'CM' },
  { label: 'Canada', value: 'CA' },
  { label: 'Chile', value: 'CL' },
  { label: 'China', value: 'CN' },
  { label: 'Colombia', value: 'CO' },
  { label: 'Congo (DRC)', value: 'CD' },
  { label: 'Costa Rica', value: 'CR' },
  { label: 'Croatia', value: 'HR' },
  { label: 'Cuba', value: 'CU' },
  { label: 'Cyprus', value: 'CY' },
  { label: 'Czech Republic', value: 'CZ' },
  { label: 'Denmark', value: 'DK' },
  { label: 'Dominican Republic', value: 'DO' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Egypt', value: 'EG' },
  { label: 'El Salvador', value: 'SV' },
  { label: 'Estonia', value: 'EE' },
  { label: 'Ethiopia', value: 'ET' },
  { label: 'Finland', value: 'FI' },
  { label: 'France', value: 'FR' },
  { label: 'Georgia', value: 'GE' },
  { label: 'Germany', value: 'DE' },
  { label: 'Ghana', value: 'GH' },
  { label: 'Greece', value: 'GR' },
  { label: 'Guatemala', value: 'GT' },
  { label: 'Honduras', value: 'HN' },
  { label: 'Hong Kong', value: 'HK' },
  { label: 'Hungary', value: 'HU' },
  { label: 'Iceland', value: 'IS' },
  { label: 'India', value: 'IN' },
  { label: 'Indonesia', value: 'ID' },
  { label: 'Iran', value: 'IR' },
  { label: 'Iraq', value: 'IQ' },
  { label: 'Ireland', value: 'IE' },
  { label: 'Israel', value: 'IL' },
  { label: 'Italy', value: 'IT' },
  { label: 'Jamaica', value: 'JM' },
  { label: 'Japan', value: 'JP' },
  { label: 'Jordan', value: 'JO' },
  { label: 'Kazakhstan', value: 'KZ' },
  { label: 'Kenya', value: 'KE' },
  { label: 'Kuwait', value: 'KW' },
  { label: 'Latvia', value: 'LV' },
  { label: 'Lebanon', value: 'LB' },
  { label: 'Libya', value: 'LY' },
  { label: 'Lithuania', value: 'LT' },
  { label: 'Luxembourg', value: 'LU' },
  { label: 'Malaysia', value: 'MY' },
  { label: 'Maldives', value: 'MV' },
  { label: 'Malta', value: 'MT' },
  { label: 'Mexico', value: 'MX' },
  { label: 'Moldova', value: 'MD' },
  { label: 'Morocco', value: 'MA' },
  { label: 'Mozambique', value: 'MZ' },
  { label: 'Myanmar', value: 'MM' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'New Zealand', value: 'NZ' },
  { label: 'Nicaragua', value: 'NI' },
  { label: 'Nigeria', value: 'NG' },
  { label: 'North Korea', value: 'KP' },
  { label: 'Norway', value: 'NO' },
  { label: 'Oman', value: 'OM' },
  { label: 'Pakistan', value: 'PK' },
  { label: 'Panama', value: 'PA' },
  { label: 'Paraguay', value: 'PY' },
  { label: 'Peru', value: 'PE' },
  { label: 'Philippines', value: 'PH' },
  { label: 'Poland', value: 'PL' },
  { label: 'Portugal', value: 'PT' },
  { label: 'Qatar', value: 'QA' },
  { label: 'Romania', value: 'RO' },
  { label: 'Russia', value: 'RU' },
  { label: 'Saudi Arabia', value: 'SA' },
  { label: 'Senegal', value: 'SN' },
  { label: 'Serbia', value: 'RS' },
  { label: 'Singapore', value: 'SG' },
  { label: 'Slovakia', value: 'SK' },
  { label: 'Slovenia', value: 'SI' },
  { label: 'South Africa', value: 'ZA' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Spain', value: 'ES' },
  { label: 'Sri Lanka', value: 'LK' },
  { label: 'Sudan', value: 'SD' },
  { label: 'Sweden', value: 'SE' },
  { label: 'Switzerland', value: 'CH' },
  { label: 'Syria', value: 'SY' },
  { label: 'Taiwan', value: 'TW' },
  { label: 'Tanzania', value: 'TZ' },
  { label: 'Thailand', value: 'TH' },
  { label: 'Tunisia', value: 'TN' },
  { label: 'Turkey', value: 'TR' },
  { label: 'Uganda', value: 'UG' },
  { label: 'Ukraine', value: 'UA' },
  { label: 'United Arab Emirates', value: 'AE' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'United States', value: 'US' },
  { label: 'Uruguay', value: 'UY' },
  { label: 'Uzbekistan', value: 'UZ' },
  { label: 'Venezuela', value: 'VE' },
  { label: 'Vietnam', value: 'VN' },
  { label: 'Yemen', value: 'YE' },
  { label: 'Zimbabwe', value: 'ZW' },
];

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
      .min(1, 'Please select a country')
      .length(2, 'Please select a country')
      .regex(/^[A-Z]{2}$/, 'Please select a country'),
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
          <Label htmlFor="countryCode">Country</Label>
          <Select
            id="countryCode"
            options={[{ label: 'Select country…', value: '' }, ...COUNTRIES]}
            {...register('countryCode')}
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
