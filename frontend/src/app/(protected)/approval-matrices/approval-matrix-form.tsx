'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type {
  ApprovalMatrix,
  Currency,
  PaymentType,
  Role,
  User,
} from '@/types/domain';

const stepSchema = z
  .object({
    stepOrder: z.coerce.number().int().min(1),
    approverType: z.enum(['USER', 'ROLE']),
    approverUserId: z.string().uuid().optional().or(z.literal('')),
    approverRoleId: z.string().uuid().optional().or(z.literal('')),
    isOptional: z.boolean(),
  })
  .refine(
    (v) =>
      v.approverType === 'USER'
        ? !!v.approverUserId
        : !!v.approverRoleId,
    {
      message: 'Pick a user or role for this step',
      path: ['approverUserId'],
    },
  );

const bandSchema = z
  .object({
    currencyCode: z.string().length(3, '3-letter ISO code'),
    minAmountMinor: z.coerce.number().int().min(0),
    maxAmountMinor: z
      .union([z.literal('').transform(() => null), z.coerce.number().int().min(0)])
      .nullable()
      .optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    steps: z.array(stepSchema).min(1, 'At least one approval step'),
  })
  .refine(
    (b) =>
      b.maxAmountMinor === null ||
      b.maxAmountMinor === undefined ||
      b.maxAmountMinor >= b.minAmountMinor,
    { message: 'Max must be ≥ min (or empty for open-ended)', path: ['maxAmountMinor'] },
  );

export const matrixSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  paymentTypeCode: z.string().min(2, 'Pick a payment type'),
  effectiveFrom: z.string().min(1, 'Required'),
  bands: z.array(bandSchema).min(1, 'At least one band is required'),
});

export type MatrixFormData = z.infer<typeof matrixSchema>;

interface Props {
  defaultValues?: Partial<ApprovalMatrix>;
  paymentTypes: PaymentType[];
  currencies: Currency[];
  users: User[];
  roles: Role[];
  /** When editing a published matrix nothing is mutable. */
  readOnly?: boolean;
  /** Payment type cannot change once created (since version numbering is per-code). */
  paymentTypeLocked?: boolean;
  submitting?: boolean;
  onSubmit: (data: MatrixFormData) => void | Promise<void>;
}

export function ApprovalMatrixForm({
  defaultValues,
  paymentTypes,
  currencies,
  users,
  roles,
  readOnly,
  paymentTypeLocked,
  submitting,
  onSubmit,
}: Props): React.ReactElement {
  const form = useForm<MatrixFormData>({
    resolver: zodResolver(matrixSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      paymentTypeCode: defaultValues?.paymentTypeCode ?? '',
      effectiveFrom:
        defaultValues?.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      bands:
        defaultValues?.bands?.map((b) => ({
          currencyCode: b.currencyCode,
          minAmountMinor: b.minAmountMinor,
          maxAmountMinor: b.maxAmountMinor ?? null,
          sortOrder: b.sortOrder ?? 0,
          steps: b.steps.map((s) => ({
            stepOrder: s.stepOrder,
            approverType: s.approverType,
            approverUserId: s.approverUserId ?? '',
            approverRoleId: s.approverRoleId ?? '',
            isOptional: s.isOptional,
          })),
        })) ?? [],
    },
  });
  const { register, control, handleSubmit, formState } = form;
  const { errors } = formState;
  const bands = useFieldArray({ control, name: 'bands' });

  const paymentTypeOpts = React.useMemo(
    () => [
      { label: '— select —', value: '' },
      ...paymentTypes
        .filter((p) => p.requiresApprovalChain && p.isActive)
        .map((p) => ({ label: `${p.name} (${p.code})`, value: p.code })),
    ],
    [paymentTypes],
  );

  const currencyOpts = React.useMemo(
    () =>
      currencies
        .filter((c) => c.isActive)
        .map((c) => ({ label: c.code, value: c.code })),
    [currencies],
  );

  const userOpts = React.useMemo(
    () => [
      { label: '— pick user —', value: '' },
      ...users.map((u) => ({ label: `${u.fullName} <${u.email}>`, value: u.id })),
    ],
    [users],
  );

  const roleOpts = React.useMemo(
    () => [
      { label: '— pick role —', value: '' },
      ...roles.map((r) => ({ label: r.name, value: r.id })),
    ],
    [roles],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-h-[80vh] space-y-6 overflow-y-auto pr-2"
    >
      <fieldset disabled={readOnly} className="space-y-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Vendor Payment — Standard" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTypeCode">Payment type</Label>
            <Select
              id="paymentTypeCode"
              options={paymentTypeOpts}
              disabled={paymentTypeLocked}
              {...register('paymentTypeCode')}
            />
            {errors.paymentTypeCode && (
              <p className="text-xs text-destructive">{errors.paymentTypeCode.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="effectiveFrom">Effective from</Label>
            <Input
              id="effectiveFrom"
              type="date"
              {...register('effectiveFrom')}
            />
            {errors.effectiveFrom && (
              <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Currency-native bands</h3>
              <p className="text-xs text-muted-foreground">
                Bands are evaluated against the payment&apos;s native amount.
                Approval thresholds are not FX-converted (SOW §2.1). The highest
                band per currency may be open-ended (leave max empty).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                bands.append({
                  currencyCode: currencies[0]?.code ?? 'USD',
                  minAmountMinor: 0,
                  maxAmountMinor: null,
                  sortOrder: bands.fields.length,
                  steps: [
                    {
                      stepOrder: 1,
                      approverType: 'ROLE',
                      approverUserId: '',
                      approverRoleId: '',
                      isOptional: false,
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add band
            </Button>
          </div>

          {errors.bands && typeof errors.bands.message === 'string' && (
            <p className="mb-2 text-xs text-destructive">{errors.bands.message}</p>
          )}

          {bands.fields.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              No bands configured yet.
            </p>
          ) : (
            <div className="space-y-3">
              {bands.fields.map((b, bIdx) => {
                const bandError = errors.bands?.[bIdx];
                return (
                  <BandRow
                    key={b.id}
                    index={bIdx}
                    control={control}
                    register={register}
                    minError={bandError?.minAmountMinor?.message}
                    maxError={bandError?.maxAmountMinor?.message}
                    stepsError={
                      typeof bandError?.steps?.message === 'string'
                        ? bandError.steps.message
                        : undefined
                    }
                    currencyOpts={currencyOpts}
                    userOpts={userOpts}
                    roleOpts={roleOpts}
                    onRemove={() => bands.remove(bIdx)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </fieldset>

      <DialogFooter>
        <Button type="submit" disabled={submitting || readOnly}>
          {submitting ? 'Saving…' : 'Save draft'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface BandRowProps {
  index: number;
  control: ReturnType<typeof useForm<MatrixFormData>>['control'];
  register: ReturnType<typeof useForm<MatrixFormData>>['register'];
  minError?: string;
  maxError?: string;
  stepsError?: string;
  currencyOpts: { label: string; value: string }[];
  userOpts: { label: string; value: string }[];
  roleOpts: { label: string; value: string }[];
  onRemove: () => void;
}

function BandRow({
  index,
  control,
  register,
  minError,
  maxError,
  stepsError,
  currencyOpts,
  userOpts,
  roleOpts,
  onRemove,
}: BandRowProps): React.ReactElement {
  const steps = useFieldArray({ control, name: `bands.${index}.steps` });
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="grid grid-cols-12 items-end gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Currency</Label>
          <Select options={currencyOpts} {...register(`bands.${index}.currencyCode`)} />
        </div>
        <div className="col-span-3 space-y-1">
          <Label className="text-xs">Min (minor)</Label>
          <Input
            type="number"
            min={0}
            {...register(`bands.${index}.minAmountMinor`)}
          />
        </div>
        <div className="col-span-3 space-y-1">
          <Label className="text-xs">Max (minor, blank = ∞)</Label>
          <Input
            type="number"
            min={0}
            placeholder="∞"
            {...register(`bands.${index}.maxAmountMinor`)}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Sort</Label>
          <Input type="number" min={0} {...register(`bands.${index}.sortOrder`)} />
        </div>
        <div className="col-span-2 flex justify-end">
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {(minError || maxError) && (
        <p className="mt-1 text-xs text-destructive">
          {minError ?? maxError}
        </p>
      )}
      {stepsError && (
        <p className="mt-1 text-xs text-destructive">{stepsError}</p>
      )}

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-xs font-semibold">Sequential approver chain</h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              steps.append({
                stepOrder: steps.fields.length + 1,
                approverType: 'ROLE',
                approverUserId: '',
                approverRoleId: '',
                isOptional: false,
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add step
          </Button>
        </div>
        {steps.fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground">
            No steps yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {steps.fields.map((s, sIdx) => (
              <li key={s.id} className="grid grid-cols-12 items-center gap-2 rounded border bg-background p-2">
                <div className="col-span-1 text-center text-xs font-semibold text-muted-foreground">
                  #{sIdx + 1}
                </div>
                <div className="col-span-2">
                  <Select
                    options={[
                      { label: 'Role', value: 'ROLE' },
                      { label: 'User', value: 'USER' },
                    ]}
                    {...register(`bands.${index}.steps.${sIdx}.approverType`)}
                  />
                </div>
                <div className="col-span-6">
                  <Controller
                    control={control}
                    name={`bands.${index}.steps.${sIdx}.approverType`}
                    render={({ field }) =>
                      field.value === 'USER' ? (
                        <Select
                          options={userOpts}
                          {...register(`bands.${index}.steps.${sIdx}.approverUserId`)}
                        />
                      ) : (
                        <Select
                          options={roleOpts}
                          {...register(`bands.${index}.steps.${sIdx}.approverRoleId`)}
                        />
                      )
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      {...register(`bands.${index}.steps.${sIdx}.isOptional`)}
                    />
                    Optional
                  </label>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" size="icon" variant="ghost" onClick={() => steps.remove(sIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <input
                  type="hidden"
                  {...register(`bands.${index}.steps.${sIdx}.stepOrder`)}
                  value={sIdx + 1}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
