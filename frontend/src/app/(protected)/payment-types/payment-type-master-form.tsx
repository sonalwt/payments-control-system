'use client';

import { useForm, useFieldArray, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { todayInDubai } from '@/lib/datetime';
import type {
  ApprovalMatrix,
  Currency,
  LegalEntity,
  Paginated,
  PaymentCategory,
  PaymentType,
  Role,
  User,
} from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

// ── Schema ──────────────────────────────────────────────────────────────────
// One combined record: the payment type plus its single approval matrix. The
// two halves still persist to separate tables (the page makes two API calls in
// one save); this form just presents and validates them as one unit.

const stepSchema = z.object({
  approverUserId: z.string().uuid('Select an approver user'),
  isOptional: z.boolean().optional(),
});

const bandSchema = z.object({
  minAmount: z.coerce.number().min(0),
  // Blank Max = "and above" (open-ended). literal('') is tried first so coerce
  // doesn't turn '' into 0.
  maxAmount: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
});

export const paymentTypeMasterSchema = z
  .object({
    // — Payment type —
    code: z.string().min(2).max(40).regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE'),
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

    // — Approval matrix (only required when the type uses one) —
    matrixName: z.string().optional().or(z.literal('')),
    currencyId: z.string().uuid().optional().or(z.literal('')),
    ttMode: z.enum(['ONLINE_TT', 'OFFLINE_TT']).optional(),
    treasuryMakerRoleId: z.string().uuid().optional().or(z.literal('')),
    treasuryCheckerRoleId: z.string().uuid().optional().or(z.literal('')),
    treasuryAuthoriserRoleId: z.string().uuid().optional().or(z.literal('')),
    effectiveFrom: z.string().optional().or(z.literal('')),
    effectiveTo: z.string().optional().or(z.literal('')),
    bands: z.array(bandSchema).optional().default([]),
  })
  .superRefine((d, ctx) => {
    const usesMatrix = d.requiresApprovalChain || d.isConfidential;
    if (!usesMatrix) return;

    if (!d.matrixName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['matrixName'], message: 'Matrix name is required' });
    if (!d.currencyId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['currencyId'], message: 'Select a currency' });
    if (!d.effectiveFrom) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['effectiveFrom'], message: 'Required' });

    if (d.isConfidential) {
      if (!d.treasuryAuthoriserRoleId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['treasuryAuthoriserRoleId'], message: 'Select a treasury authoriser role' });
    } else {
      // requiresApprovalChain
      if (!d.bands || d.bands.length < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bands'], message: 'At least one band is required' });
      if (!d.treasuryMakerRoleId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['treasuryMakerRoleId'], message: 'Select a treasury maker role' });
      if (!d.treasuryCheckerRoleId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['treasuryCheckerRoleId'], message: 'Select a treasury checker role' });
      if (!d.treasuryAuthoriserRoleId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['treasuryAuthoriserRoleId'], message: 'Select a treasury authoriser role' });
    }
  });

export type PaymentTypeMasterFormData = z.infer<typeof paymentTypeMasterSchema>;

// Shape handed to the page: ready-to-send payloads for each table. `matrix` is
// null when the type uses no approval matrix (e.g. incoming receipts).
export interface PaymentTypeMasterSubmit {
  paymentType: {
    code: string;
    name: string;
    description?: string;
    paymentCategoryId?: string;
    legalEntityId: string;
    makerRoleIds: string[];
    checkerRoleId?: string;
    direction: 'OUTGOING' | 'INCOMING';
    requiresApprovalChain?: boolean;
    isBatchBased?: boolean;
    isConfidential?: boolean;
    mobileInitiationOnly?: boolean;
    allowsCrossCurrency?: boolean;
    isActive?: boolean;
  };
  matrix: {
    name: string;
    currencyId: string;
    ttMode: 'ONLINE_TT' | 'OFFLINE_TT';
    treasuryMakerRoleId?: string;
    treasuryCheckerRoleId?: string;
    treasuryAuthoriserRoleId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive: boolean;
    bands?: {
      minAmount: number;
      maxAmount: number | null;
      steps: { approverType: 'USER'; approverUserId: string; isOptional: boolean }[];
    }[];
  } | null;
}

interface Props {
  paymentType?: Partial<PaymentType>;
  matrix?: Partial<ApprovalMatrix> | null;
  onSubmit: (data: PaymentTypeMasterSubmit) => void | Promise<void>;
  submitting?: boolean;
}

// ── Band / step editor (inline) ───────────────────────────────────────────────
function StepRow({
  bandIdx,
  stepIdx,
  userOptions,
  register,
  onRemove,
}: {
  bandIdx: number;
  stepIdx: number;
  userOptions: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded border p-2">
      <div>
        <Label className="text-xs">Approver</Label>
        <Select
          placeholder="Select approver user"
          options={userOptions}
          {...register(`bands.${bandIdx}.steps.${stepIdx}.approverUserId`)}
        />
      </div>
      <label className="mb-2 flex items-center gap-1 text-xs">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register(`bands.${bandIdx}.steps.${stepIdx}.isOptional`)} />
        Optional
      </label>
      <Button type="button" size="icon" variant="ghost" className="mb-1" onClick={onRemove} title="Remove step">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function BandSection({
  control,
  bandIdx,
  userOptions,
  register,
  onRemoveBand,
}: {
  control: Control<PaymentTypeMasterFormData>;
  bandIdx: number;
  userOptions: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  onRemoveBand: () => void;
}): React.ReactElement {
  const stepArr = useFieldArray({ control, name: `bands.${bandIdx}.steps` });
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs">Min amount</Label>
          <Input type="number" step="0.01" min={0} {...register(`bands.${bandIdx}.minAmount`)} />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Max amount <span className="text-muted-foreground font-normal">(blank = and above)</span></Label>
          <Input type="number" step="0.01" min={0} placeholder="and above" {...register(`bands.${bandIdx}.maxAmount`)} />
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemoveBand} title="Remove band">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Approval chain</p>
          <Button type="button" size="sm" variant="outline" onClick={() => stepArr.append({ approverUserId: '', isOptional: false })}>
            <Plus className="mr-1 h-3 w-3" /> Add step
          </Button>
        </div>
        {stepArr.fields.length === 0 ? (
          <p className="text-xs text-destructive">At least one step is required.</p>
        ) : (
          <div className="space-y-2">
            {stepArr.fields.map((f, i) => (
              <StepRow key={f.id} bandIdx={bandIdx} stepIdx={i} userOptions={userOptions} register={register} onRemove={() => stepArr.remove(i)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Combined form ─────────────────────────────────────────────────────────────
export function PaymentTypeMasterForm({ paymentType, matrix, onSubmit, submitting }: Props): React.ReactElement {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentTypeMasterFormData>({
    resolver: zodResolver(paymentTypeMasterSchema),
    defaultValues: {
      code: paymentType?.code ?? '',
      name: paymentType?.name ?? '',
      description: paymentType?.description ?? '',
      paymentCategoryId: paymentType?.paymentCategoryId ?? '',
      legalEntityId: paymentType?.legalEntityId ?? '',
      makerRoleIds: paymentType?.makerRoleIds ?? (paymentType?.makerRoleId ? [paymentType.makerRoleId] : []),
      checkerRoleId: paymentType?.checkerRoleId ?? '',
      direction: (paymentType?.direction ?? 'OUTGOING') as 'OUTGOING' | 'INCOMING',
      requiresApprovalChain: paymentType?.requiresApprovalChain ?? true,
      isBatchBased: paymentType?.isBatchBased ?? false,
      isConfidential: paymentType?.isConfidential ?? false,
      mobileInitiationOnly: paymentType?.mobileInitiationOnly ?? false,
      allowsCrossCurrency: paymentType?.allowsCrossCurrency ?? true,
      isActive: paymentType?.isActive ?? true,

      matrixName: matrix?.name ?? '',
      currencyId: matrix?.currencyId ?? '',
      ttMode: matrix?.ttMode ?? 'ONLINE_TT',
      treasuryMakerRoleId: matrix?.treasuryMakerRoleId ?? '',
      treasuryCheckerRoleId: matrix?.treasuryCheckerRoleId ?? '',
      treasuryAuthoriserRoleId: matrix?.treasuryAuthoriserRoleId ?? '',
      effectiveFrom: matrix?.effectiveFrom ?? todayInDubai(),
      effectiveTo: matrix?.effectiveTo ?? '',
      bands:
        matrix?.bands?.map((b) => ({
          minAmount: Number(b.minAmount),
          maxAmount: b.maxAmount == null ? '' : Number(b.maxAmount),
          steps: b.steps.map((s) => ({
            approverUserId: s.approverType === 'USER' ? (s.approverUserId ?? '') : '',
            isOptional: s.isOptional ?? false,
          })),
        })) ?? [{ minAmount: 0, maxAmount: '', steps: [{ approverUserId: '', isOptional: false }] }],
    },
  });

  const bandArr = useFieldArray({ control, name: 'bands' });

  const { data: categories } = useQuery({
    queryKey: ['payment-categories-all'],
    queryFn: () => api.get<Paginated<PaymentCategory>>('/payment-categories?page=1&limit=200'),
  });
  const categoryOptions = (categories?.data ?? []).filter((c) => c.isActive).map((c) => ({ label: c.name, value: c.id }));

  const { data: legalEntities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
  });
  const legalEntityOptions = (legalEntities?.data ?? []).filter((le) => le.isActive).map((le) => ({ label: `${le.code} — ${le.name}`, value: le.id }));

  const { data: roles } = useQuery({ queryKey: ['roles-all'], queryFn: () => api.get<Role[]>('/roles') });
  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }));

  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const currencyOptions = (currencies?.data ?? []).filter((c) => c.isActive).map((c) => ({ label: c.code ? `${c.code} — ${c.name}` : c.name, value: c.id }));

  const { data: users } = useQuery({
    queryKey: ['users-with-approver-role'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200&roleCode=APPROVER'),
  });
  const userOptions = (users?.data ?? []).filter((u) => u.isActive).map((u) => ({ label: `${u.fullName} (${u.email})`, value: u.id }));

  const makerRoleIds = watch('makerRoleIds') ?? [];
  const requiresApprovalChain = watch('requiresApprovalChain') ?? false;
  const isConfidential = watch('isConfidential') ?? false;
  const usesMatrix = requiresApprovalChain || isConfidential;
  const isSystem = paymentType?.isSystem ?? false;

  const submit = handleSubmit((d) => {
    const paymentTypePayload: PaymentTypeMasterSubmit['paymentType'] = {
      code: d.code,
      name: d.name,
      description: d.description || undefined,
      paymentCategoryId: d.paymentCategoryId || undefined,
      legalEntityId: d.legalEntityId,
      makerRoleIds: d.makerRoleIds ?? [],
      checkerRoleId: d.checkerRoleId || undefined,
      direction: d.direction,
      requiresApprovalChain: d.requiresApprovalChain,
      isBatchBased: d.isBatchBased,
      isConfidential: d.isConfidential,
      mobileInitiationOnly: d.mobileInitiationOnly,
      allowsCrossCurrency: d.allowsCrossCurrency,
      isActive: d.isActive,
    };

    let matrixPayload: PaymentTypeMasterSubmit['matrix'] = null;
    if (usesMatrix) {
      matrixPayload = {
        name: d.matrixName as string,
        currencyId: d.currencyId as string,
        ttMode: (d.ttMode ?? 'ONLINE_TT') as 'ONLINE_TT' | 'OFFLINE_TT',
        treasuryMakerRoleId: d.isConfidential ? undefined : d.treasuryMakerRoleId || undefined,
        treasuryCheckerRoleId: d.isConfidential ? undefined : d.treasuryCheckerRoleId || undefined,
        treasuryAuthoriserRoleId: d.treasuryAuthoriserRoleId || undefined,
        effectiveFrom: d.effectiveFrom as string,
        effectiveTo: d.effectiveTo || undefined,
        isActive: d.isActive ?? true,
        // Confidential matrices carry no bands.
        bands: d.isConfidential
          ? undefined
          : (d.bands ?? []).map((b) => ({
              minAmount: Number(b.minAmount),
              maxAmount: b.maxAmount === '' || b.maxAmount == null ? null : Number(b.maxAmount),
              steps: b.steps.map((s) => ({ approverType: 'USER' as const, approverUserId: s.approverUserId, isOptional: s.isOptional ?? false })),
            })),
      };
    }

    return onSubmit({ paymentType: paymentTypePayload, matrix: matrixPayload });
  });

  return (
    <form onSubmit={submit} className="space-y-5 max-h-[78vh] overflow-y-auto pr-2">
      {/* ── Payment type ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Payment type</h3>
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
            <Select id="paymentCategoryId" placeholder="Select category" options={[{ label: '— None —', value: '' }, ...categoryOptions]} {...register('paymentCategoryId')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direction">Direction <span className="text-destructive">*</span></Label>
            <Select id="direction" options={[{ label: 'Outgoing (payment)', value: 'OUTGOING' }, { label: 'Incoming (receipt)', value: 'INCOMING' }]} {...register('direction')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalEntityId">Legal entity <span className="text-destructive">*</span></Label>
          <Select id="legalEntityId" placeholder="Select legal entity" options={legalEntityOptions} {...register('legalEntityId')} />
          {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Payment request creator roles (Maker)</Label>
          <p className="text-xs text-muted-foreground">Select one or more roles. Any user holding one of these may create requests for this payment type.</p>
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
                        const next = e.target.checked ? [...makerRoleIds, r.value] : makerRoleIds.filter((id) => id !== r.value);
                        setValue('makerRoleIds', next, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                    <span>{r.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkerRoleId">Payment request checker role</Label>
          <Select id="checkerRoleId" placeholder="Select Checker role" options={[{ label: '— None —', value: '' }, ...roleOptions]} {...register('checkerRoleId')} />
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <p className="text-sm font-medium">Workflow behaviour</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={requiresApprovalChain}
                onChange={(e) => {
                  const on = e.target.checked;
                  setValue('requiresApprovalChain', on, { shouldDirty: true });
                  if (on) setValue('isConfidential', false, { shouldDirty: true });
                }}
              />
              <span>Requires approval chain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('isBatchBased')} />
              <span>Batch-based (e.g. payroll)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={isConfidential}
                onChange={(e) => {
                  const on = e.target.checked;
                  setValue('isConfidential', on, { shouldDirty: true });
                  if (on) setValue('requiresApprovalChain', false, { shouldDirty: true });
                }}
              />
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
      </section>

      {/* ── Approval matrix ── */}
      <section className="space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Approval matrix</h3>
          {!usesMatrix && (
            <p className="text-xs text-muted-foreground mt-1">
              This payment type uses no approval matrix. Enable “Requires approval chain” or “Confidential” above to configure one.
            </p>
          )}
        </div>

        {usesMatrix && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matrixName">Matrix name <span className="text-destructive">*</span></Label>
                <Input id="matrixName" placeholder="Trade Payments — USD" {...register('matrixName')} />
                {errors.matrixName && <p className="text-xs text-destructive">{errors.matrixName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencyId">Currency <span className="text-destructive">*</span></Label>
                <Select id="currencyId" placeholder="Select currency" options={currencyOptions} {...register('currencyId')} />
                {errors.currencyId && <p className="text-xs text-destructive">{errors.currencyId.message}</p>}
              </div>
            </div>

            {!isConfidential && (
              <div className="space-y-2">
                <Label htmlFor="ttMode">Treasury mode (TT) <span className="text-destructive">*</span></Label>
                <Select id="ttMode" options={[{ label: 'Online TT', value: 'ONLINE_TT' }, { label: 'Offline TT', value: 'OFFLINE_TT' }]} {...register('ttMode')} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective from <span className="text-destructive">*</span></Label>
                <Input id="effectiveFrom" type="date" {...register('effectiveFrom')} />
                {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Effective to</Label>
                <Input id="effectiveTo" type="date" {...register('effectiveTo')} />
              </div>
            </div>

            {isConfidential ? (
              <div className="rounded-md border p-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Confidential payments bypass the approval matrix and route directly to the Treasury Authoriser. Select the role that completes them.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="treasuryAuthoriserRoleId">Treasury Authoriser <span className="text-destructive">*</span></Label>
                  <Select id="treasuryAuthoriserRoleId" placeholder="Select role" options={roleOptions} {...register('treasuryAuthoriserRoleId')} />
                  {errors.treasuryAuthoriserRoleId && <p className="text-xs text-destructive">{errors.treasuryAuthoriserRoleId.message}</p>}
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-md border p-3 space-y-3">
                  <p className="text-sm font-medium">Treasury stage roles</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="treasuryMakerRoleId">Treasury Maker <span className="text-destructive">*</span></Label>
                      <Select id="treasuryMakerRoleId" placeholder="Select role" options={roleOptions} {...register('treasuryMakerRoleId')} />
                      {errors.treasuryMakerRoleId && <p className="text-xs text-destructive">{errors.treasuryMakerRoleId.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treasuryCheckerRoleId">Treasury Checker <span className="text-destructive">*</span></Label>
                      <Select id="treasuryCheckerRoleId" placeholder="Select role" options={roleOptions} {...register('treasuryCheckerRoleId')} />
                      {errors.treasuryCheckerRoleId && <p className="text-xs text-destructive">{errors.treasuryCheckerRoleId.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treasuryAuthoriserRoleId">Treasury Authoriser <span className="text-destructive">*</span></Label>
                      <Select id="treasuryAuthoriserRoleId" placeholder="Select role" options={roleOptions} {...register('treasuryAuthoriserRoleId')} />
                      {errors.treasuryAuthoriserRoleId && <p className="text-xs text-destructive">{errors.treasuryAuthoriserRoleId.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Bands & approval chain</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => bandArr.append({ minAmount: 0, maxAmount: '', steps: [{ approverUserId: '', isOptional: false }] })}>
                      <Plus className="mr-1 h-3 w-3" /> Add band
                    </Button>
                  </div>
                  {bandArr.fields.length === 0 ? (
                    <p className="text-xs text-destructive">At least one band is required.</p>
                  ) : (
                    <div className="space-y-3">
                      {bandArr.fields.map((f, i) => (
                        <BandSection key={f.id} control={control} bandIdx={i} userOptions={userOptions} register={register} onRemoveBand={() => bandArr.remove(i)} />
                      ))}
                    </div>
                  )}
                  {errors.bands && <p className="text-xs text-destructive">{errors.bands.message as string}</p>}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}
