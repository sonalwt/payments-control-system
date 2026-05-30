'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Search, ShieldAlert, Upload, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  Bank,
  BeneficiaryAccount,
  BeneficiaryAccountChangeRequest,
  Counterparty,
  Country,
  Currency,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

const BENE_KEY = 'beneficiary-accounts';
const CR_KEY = 'beneficiary-change-requests';

const BENE_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDING_ACTIVATION: 'bg-amber-50 text-amber-700 ring-amber-200',
  INACTIVE: 'bg-muted text-muted-foreground ring-border',
};
const CR_STATUS_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 ring-amber-200',
  VERIFIED: 'bg-blue-50 text-blue-700 ring-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  CANCELLED: 'bg-muted text-muted-foreground ring-border',
};

// ---------------------------------------------------------------------
// Create Change Request — ADD (the only flow built in MVP)
// ---------------------------------------------------------------------

const addSchema = z.object({
  ownerType: z.enum(['COUNTERPARTY', 'EMPLOYEE']),
  counterpartyId: z.string().uuid().optional().or(z.literal('')),
  employeeId: z.string().uuid().optional().or(z.literal('')),
  accountHolderName: z.string().min(2).max(200),
  accountNumber: z.string().min(2).max(60),
  bankId: z.string().uuid('Select a bank'),
  currencyId: z.string().uuid('Select a currency'),
  countryId: z.string().uuid('Select a country'),
  branchName: z.string().max(120).optional().or(z.literal('')),
  swiftBic: z.string().max(11).optional().or(z.literal('')),
  iban: z.string().max(34).optional().or(z.literal('')),
  accountDirection: z.enum(['PAY_TO', 'RECEIVE_FROM', 'BOTH']),
  // §6.2 supporting documents — minimum one
  docCancelledChequeUrl: z.string().min(1, 'Cancelled cheque / bank letter URL required'),
  docCancelledChequeFileName: z.string().min(1),
  docCounterpartyLetterUrl: z.string().min(1, 'Counterparty letter URL required'),
  docCounterpartyLetterFileName: z.string().min(1),
});
type AddFormData = z.infer<typeof addSchema>;

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

function AddChangeRequestForm({
  onSubmit, submitting,
}: { onSubmit: (d: AddFormData) => void; submitting?: boolean }): React.ReactElement {
  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: { ownerType: 'COUNTERPARTY', accountDirection: 'PAY_TO' },
  });

  const ownerType = watch('ownerType');

  const [chequeStatus, setChequeStatus] = useState<UploadStatus>('idle');
  const [chequeError, setChequeError] = useState('');
  const chequeFileRef = useRef<HTMLInputElement>(null);

  const [letterStatus, setLetterStatus] = useState<UploadStatus>('idle');
  const [letterError, setLetterError] = useState('');
  const letterFileRef = useRef<HTMLInputElement>(null);

  const chequeFileName = watch('docCancelledChequeFileName');
  const letterFileName = watch('docCounterpartyLetterFileName');

  async function handleUpload(
    file: File,
    setStatus: (s: UploadStatus) => void,
    setError: (e: string) => void,
    urlField: 'docCancelledChequeUrl' | 'docCounterpartyLetterUrl',
    nameField: 'docCancelledChequeFileName' | 'docCounterpartyLetterFileName',
  ): Promise<void> {
    setStatus('uploading');
    setError('');
    try {
      const result = await api.upload(file);
      setValue(urlField, result.url, { shouldValidate: true });
      setValue(nameField, result.fileName, { shouldValidate: true });
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }

  const { data: counterparties } = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=200'),
  });
  const { data: banks } = useQuery({
    queryKey: ['banks-all'],
    queryFn: () => api.get<Paginated<Bank>>('/banks?page=1&limit=200'),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=200'),
  });
  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => api.get<Paginated<Country>>('/countries?page=1&limit=300'),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ownerType">Owner type <span className="text-destructive">*</span></Label>
          <Select id="ownerType" options={[
            { label: 'Counterparty (vendor/customer)', value: 'COUNTERPARTY' },
            { label: 'Employee', value: 'EMPLOYEE' },
          ]} {...register('ownerType')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountDirection">Direction <span className="text-destructive">*</span></Label>
          <Select id="accountDirection" options={[
            { label: 'Pay-to (outgoing)', value: 'PAY_TO' },
            { label: 'Receive-from (incoming)', value: 'RECEIVE_FROM' },
            { label: 'Both', value: 'BOTH' },
          ]} {...register('accountDirection')} />
        </div>
      </div>

      {ownerType === 'COUNTERPARTY' && (
        <div className="space-y-2">
          <Label htmlFor="counterpartyId">Counterparty <span className="text-destructive">*</span></Label>
          <Select id="counterpartyId" placeholder="Select counterparty"
            options={(counterparties?.data ?? []).map((c) => ({ label: c.legalName ?? c.id, value: c.id }))}
            {...register('counterpartyId')} />
        </div>
      )}
      {ownerType === 'EMPLOYEE' && (
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee UUID <span className="text-destructive">*</span></Label>
          <Input id="employeeId" placeholder="employee id" {...register('employeeId')} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">Account holder <span className="text-destructive">*</span></Label>
          <Input id="accountHolderName" {...register('accountHolderName')} />
          {errors.accountHolderName && <p className="text-xs text-destructive">{errors.accountHolderName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account number <span className="text-destructive">*</span></Label>
          <Input id="accountNumber" {...register('accountNumber')} />
          {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bankId">Bank <span className="text-destructive">*</span></Label>
          <Select id="bankId" placeholder="Select bank"
            options={(banks?.data ?? []).map((b) => ({ label: b.name, value: b.id }))}
            {...register('bankId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyId">Currency <span className="text-destructive">*</span></Label>
          <Select id="currencyId" placeholder="Select currency"
            options={(currencies?.data ?? []).map((c) => ({ label: c.code ? `${c.code} — ${c.name ?? ''}` : (c.name ?? c.id), value: c.id }))}
            {...register('currencyId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryId">Country <span className="text-destructive">*</span></Label>
          <Select id="countryId" placeholder="Select country"
            options={(countries?.data ?? []).map((c) => ({
              label: c.isSanctioned ? `${c.countryName} (sanctioned)` : c.countryName,
              value: c.id,
            }))}
            {...register('countryId')} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branchName">Branch name</Label>
          <Input id="branchName" {...register('branchName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="swiftBic">SWIFT / BIC</Label>
          <Input id="swiftBic" {...register('swiftBic')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input id="iban" {...register('iban')} />
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <p className="text-sm font-medium">Supporting documents (SoW §6.2 — both required)</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Cancelled cheque / bank letter */}
          <div className="space-y-2">
            <Label>Cancelled cheque / bank letter <span className="text-destructive">*</span></Label>
            <input type="hidden" {...register('docCancelledChequeUrl')} />
            <input type="hidden" {...register('docCancelledChequeFileName')} />
            <input
              ref={chequeFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, setChequeStatus, setChequeError, 'docCancelledChequeUrl', 'docCancelledChequeFileName');
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={chequeStatus === 'uploading'}
                onClick={() => chequeFileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {chequeStatus === 'done' ? 'Replace' : 'Choose file'}
              </Button>
              {chequeStatus === 'uploading' && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                </span>
              )}
              {chequeStatus === 'done' && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {chequeFileName}
                </span>
              )}
              {chequeStatus === 'idle' && (
                <span className="text-sm text-muted-foreground">No file selected</span>
              )}
            </div>
            {chequeStatus === 'error' && <p className="text-xs text-destructive">{chequeError}</p>}
            {errors.docCancelledChequeUrl && chequeStatus !== 'done' && (
              <p className="text-xs text-destructive">{errors.docCancelledChequeUrl.message}</p>
            )}
          </div>

          {/* Counterparty letter */}
          <div className="space-y-2">
            <Label>Counterparty letter <span className="text-destructive">*</span></Label>
            <input type="hidden" {...register('docCounterpartyLetterUrl')} />
            <input type="hidden" {...register('docCounterpartyLetterFileName')} />
            <input
              ref={letterFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, setLetterStatus, setLetterError, 'docCounterpartyLetterUrl', 'docCounterpartyLetterFileName');
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={letterStatus === 'uploading'}
                onClick={() => letterFileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {letterStatus === 'done' ? 'Replace' : 'Choose file'}
              </Button>
              {letterStatus === 'uploading' && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                </span>
              )}
              {letterStatus === 'done' && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {letterFileName}
                </span>
              )}
              {letterStatus === 'idle' && (
                <span className="text-sm text-muted-foreground">No file selected</span>
              )}
            </div>
            {letterStatus === 'error' && <p className="text-xs text-destructive">{letterError}</p>}
            {errors.docCounterpartyLetterUrl && letterStatus !== 'done' && (
              <p className="text-xs text-destructive">{errors.docCounterpartyLetterUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for verification'}</Button>
      </DialogFooter>
    </form>
  );
}

// ---------------------------------------------------------------------
// Verify / Approve / Reject dialogs
// ---------------------------------------------------------------------

const verifySchema = z.object({
  callbackEvidence: z.string().min(10, 'Capture the verification call details (when, with whom, what was confirmed).'),
  verificationNotes: z.string().optional(),
});
type VerifyFormData = z.infer<typeof verifySchema>;

function VerifyDialog({
  open, onOpenChange, cr, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cr: BeneficiaryAccountChangeRequest | null;
  onSubmit: (d: VerifyFormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify change request</DialogTitle>
          <p className="text-xs text-muted-foreground">{cr?.changeType} · raised by {cr?.requestedByUser?.fullName ?? cr?.requestedBy}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="callbackEvidence">Callback evidence <span className="text-destructive">*</span></Label>
            <Textarea
              id="callbackEvidence"
              rows={4}
              placeholder="Called Acme CFO on +91-... at 14:35, confirmed account details against the bank letter."
              {...register('callbackEvidence')}
            />
            {errors.callbackEvidence && <p className="text-xs text-destructive">{errors.callbackEvidence.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="verificationNotes">Verification notes</Label>
            <Textarea id="verificationNotes" rows={2} {...register('verificationNotes')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Mark verified'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const approveSchema = z.object({
  coolingOffOverride: z.boolean().optional(),
  coolingOffOverrideReason: z.string().optional(),
});
type ApproveFormData = z.infer<typeof approveSchema>;

function ApproveDialog({
  open, onOpenChange, cr, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cr: BeneficiaryAccountChangeRequest | null;
  onSubmit: (d: ApproveFormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { register, handleSubmit, watch, reset } = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: { coolingOffOverride: false },
  });
  const overrideFlag = watch('coolingOffOverride');
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve change request</DialogTitle>
          <p className="text-xs text-muted-foreground">{cr?.changeType} · verified by {cr?.verifiedByUser?.fullName ?? cr?.verifiedBy}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Default cooling-off is 24 hours (§6.3). The beneficiary becomes payable once it elapses.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('coolingOffOverride')} />
            Override cooling-off (account becomes payable immediately)
          </label>
          {overrideFlag && (
            <div className="space-y-2">
              <Label htmlFor="coolingOffOverrideReason">Override reason <span className="text-destructive">*</span></Label>
              <Textarea id="coolingOffOverrideReason" rows={2} placeholder="Urgent payment to existing trusted counterparty …" {...register('coolingOffOverrideReason')} />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? 'Approving…' : 'Approve'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const rejectSchema = z.object({
  reason: z.string().min(5, 'Reason required'),
});
type RejectFormData = z.infer<typeof rejectSchema>;

function RejectDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: RejectFormData) => void;
  submitting?: boolean;
}): React.ReactElement {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject change request</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea id="reason" rows={3} {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default function BeneficiaryAccountsPage(): React.ReactElement {
  const [bPage, setBPage] = useState(1);
  const [bSearch, setBSearch] = useState('');
  const [crPage, setCrPage] = useState(1);
  const [crStatus, setCrStatus] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [verifying, setVerifying] = useState<BeneficiaryAccountChangeRequest | null>(null);
  const [approving, setApproving] = useState<BeneficiaryAccountChangeRequest | null>(null);
  const [rejecting, setRejecting] = useState<BeneficiaryAccountChangeRequest | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const beneParams = useMemo(() => {
    const u = new URLSearchParams({ page: String(bPage), limit: '20' });
    if (bSearch) u.set('search', bSearch);
    return u.toString();
  }, [bPage, bSearch]);
  const crParams = useMemo(() => {
    const u = new URLSearchParams({ page: String(crPage), limit: '20' });
    if (crStatus) u.set('status', crStatus);
    return u.toString();
  }, [crPage, crStatus]);

  const { data: benes, isLoading: bLoading } = useQuery({
    queryKey: [BENE_KEY, beneParams],
    queryFn: () => api.get<Paginated<BeneficiaryAccount>>(`/beneficiary-accounts?${beneParams}`),
  });

  const { data: crs, isLoading: crLoading } = useQuery({
    queryKey: [CR_KEY, crParams],
    queryFn: () => api.get<Paginated<BeneficiaryAccountChangeRequest>>(`/beneficiary-accounts/change-requests/list?${crParams}`),
  });

  const createMut = useMutation({
    mutationFn: (d: AddFormData) => api.post('/beneficiary-accounts/change-requests', {
      changeType: 'ADD' as const,
      proposedData: {
        counterpartyId: d.ownerType === 'COUNTERPARTY' ? d.counterpartyId || undefined : undefined,
        employeeId: d.ownerType === 'EMPLOYEE' ? d.employeeId || undefined : undefined,
        accountHolderName: d.accountHolderName,
        accountNumber: d.accountNumber,
        bankId: d.bankId,
        branchName: d.branchName || undefined,
        swiftBic: d.swiftBic || undefined,
        iban: d.iban || undefined,
        currencyId: d.currencyId,
        countryId: d.countryId,
        accountDirection: d.accountDirection,
      },
      documents: [
        { code: 'CANCELLED_CHEQUE', label: 'Cancelled cheque / bank letter', fileName: d.docCancelledChequeFileName, fileUrl: d.docCancelledChequeUrl },
        { code: 'COUNTERPARTY_LETTER', label: 'Counterparty letter', fileName: d.docCounterpartyLetterFileName, fileUrl: d.docCounterpartyLetterUrl },
      ],
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CR_KEY] });
      setAddOpen(false);
      notify.success('Change request submitted for verification');
    },
    onError: (e: Error) => notify.error('Submit failed', e),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: VerifyFormData }) =>
      api.post(`/beneficiary-accounts/change-requests/${id}/verify`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CR_KEY] });
      setVerifying(null);
      notify.success('Verified');
    },
    onError: (e: Error) => notify.error('Verify failed', e),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ApproveFormData }) =>
      api.post(`/beneficiary-accounts/change-requests/${id}/approve`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CR_KEY] });
      void qc.invalidateQueries({ queryKey: [BENE_KEY] });
      setApproving(null);
      notify.success('Approved — beneficiary in cooling-off window');
    },
    onError: (e: Error) => notify.error('Approve failed', e),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectFormData }) =>
      api.post(`/beneficiary-accounts/change-requests/${id}/reject`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CR_KEY] });
      setRejecting(null);
      notify.success('Rejected');
    },
    onError: (e: Error) => notify.error('Reject failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Beneficiary Accounts"
        description="Master of payable bank accounts (SoW §6). New accounts and modifications flow through the maker-checker change-request workflow with a cooling-off window."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New beneficiary (change request)</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Propose new beneficiary</DialogTitle>
                <p className="text-xs text-muted-foreground">§6.2 — submits a change request for independent verification.</p>
              </DialogHeader>
              <AddChangeRequestForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Master list */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by holder, account number, IBAN"
            value={bSearch}
            onChange={(e) => { setBPage(1); setBSearch(e.target.value); }}
            className="max-w-md"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Holder</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bLoading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : benes && benes.data.length > 0 ? benes.data.map((b) => {
              const sanctioned = b.country?.isSanctioned;
              const inCoolingOff = b.coolingOffUntil && new Date(b.coolingOffUntil).getTime() > Date.now();
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium inline-flex items-center gap-1">
                      {b.accountHolderName}
                      {sanctioned && <ShieldAlert className="h-3 w-3 text-amber-600" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.counterparty?.legalName ?? b.employee?.fullName ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{b.accountNumber}</code></TableCell>
                  <TableCell>{b.bank?.name ?? '—'}</TableCell>
                  <TableCell>{b.country?.code ?? '—'}</TableCell>
                  <TableCell>{b.currency?.code ?? '—'}</TableCell>
                  <TableCell><span className="rounded bg-muted px-1.5 py-0.5 text-xs">{b.accountDirection}</span></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BENE_STATUS_STYLES[b.status]}`}>
                      {b.status}
                    </span>
                    {inCoolingOff && (
                      <div className="text-xs text-amber-700 mt-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        cooling-off until {new Date(b.coolingOffUntil!).toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No beneficiary accounts yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {benes && <DataTablePagination page={benes.page} totalPages={benes.totalPages} total={benes.total} limit={benes.limit} onPageChange={setBPage} />}
      </Card>

      {/* Change-request queue */}
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <p className="text-sm font-medium">Change requests</p>
          <div className="ml-auto w-40">
            <Select
              options={[
                { label: 'All', value: '' },
                { label: 'Pending verification', value: 'PENDING_VERIFICATION' },
                { label: 'Verified', value: 'VERIFIED' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
              value={crStatus}
              onChange={(e) => { setCrPage(1); setCrStatus(e.target.value); }}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Holder</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-72">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : crs && crs.data.length > 0 ? crs.data.map((cr) => {
              const data = (cr.proposedData ?? {}) as Record<string, string>;
              return (
                <TableRow key={cr.id}>
                  <TableCell><span className="rounded bg-muted px-1.5 py-0.5 text-xs">{cr.changeType}</span></TableCell>
                  <TableCell className="text-sm">{data.accountHolderName ?? cr.beneficiaryAccount?.accountHolderName ?? '—'}</TableCell>
                  <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{data.accountNumber ?? cr.beneficiaryAccount?.accountNumber ?? '—'}</code></TableCell>
                  <TableCell className="text-sm">{cr.requestedByUser?.fullName ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CR_STATUS_STYLES[cr.status]}`}>
                      {cr.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 whitespace-nowrap">
                      {cr.status === 'PENDING_VERIFICATION' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setVerifying(cr)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Verify
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejecting(cr)}>
                            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
                          </Button>
                        </>
                      )}
                      {cr.status === 'VERIFIED' && (
                        <>
                          <Button size="sm" onClick={() => setApproving(cr)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejecting(cr)}>
                            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No change requests.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {crs && <DataTablePagination page={crs.page} totalPages={crs.totalPages} total={crs.total} limit={crs.limit} onPageChange={setCrPage} />}
      </Card>

      <VerifyDialog
        open={!!verifying}
        onOpenChange={(o) => !o && setVerifying(null)}
        cr={verifying}
        submitting={verifyMut.isPending}
        onSubmit={(d) => verifying && verifyMut.mutate({ id: verifying.id, body: d })}
      />
      <ApproveDialog
        open={!!approving}
        onOpenChange={(o) => !o && setApproving(null)}
        cr={approving}
        submitting={approveMut.isPending}
        onSubmit={(d) => approving && approveMut.mutate({ id: approving.id, body: d })}
      />
      <RejectDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        submitting={rejectMut.isPending}
        onSubmit={(d) => rejecting && rejectMut.mutate({ id: rejecting.id, body: d })}
      />
    </div>
  );
}
