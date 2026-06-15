'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
  Undo2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { api, type ExtractedRemittance } from '@/lib/api';
import type { PaymentRequest, PaymentRequestDocument } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { useAuth } from '@/hooks/use-auth';
import { PaymentRequestDetailView } from '@/components/payment-requests/payment-request-detail-view';

// ---------------------------------------------------------------------
// Dialog forms
// ---------------------------------------------------------------------

const approveSchema = z.object({
  comments: z.string().optional(),
  sanctionOverrideReason: z.string().optional(),
});
type ApproveData = z.infer<typeof approveSchema>;

const rejectSchema = z.object({ comments: z.string().min(5, 'Reason required (min 5 chars)') });
type RejectData = z.infer<typeof rejectSchema>;

const treasurySubmitSchema = z.object({
  referenceNumber: z.string().min(1, 'Reference number required'),
  swiftCopyUrl: z.string().min(1, 'SWIFT / MT103 copy required'),
});
type TreasurySubmitData = z.infer<typeof treasurySubmitSchema>;

type RemitRow = { label: string; expected: string; document: string; status: 'match' | 'mismatch' };

/**
 * Compare the auto-read SWIFT/MT103 copy against the reference the maker typed
 * and the approved request amount (warn-only). Returns one row per field the
 * reader could identify.
 */
function compareRemittance(
  ext: ExtractedRemittance,
  expected: { referenceNumber?: string; amount?: string },
): RemitRow[] {
  const rows: RemitRow[] = [];
  if (ext.referenceNumber != null) {
    const norm = (s: string): string => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const e = (expected.referenceNumber ?? '').trim();
    const status = e !== '' && norm(e) === norm(ext.referenceNumber) ? 'match' : 'mismatch';
    rows.push({ label: 'Reference', expected: e || '—', document: ext.referenceNumber, status });
  }
  if (ext.amount != null) {
    const e = (expected.amount ?? '').trim();
    const en = Number(e), xn = Number(ext.amount);
    const status =
      e !== '' && Number.isFinite(en) && Math.abs(en - xn) < 0.0001 ? 'match' : 'mismatch';
    rows.push({ label: 'Amount', expected: e || '—', document: ext.amount, status });
  }
  return rows;
}

// ---------------------------------------------------------------------

export default function PaymentRequestDetailPage(): React.ReactElement {
  const params = useParams();
  const id = params?.id as string;
  const notify = useNotify();
  const qc = useQueryClient();
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [treasurySubmitOpen, setTreasurySubmitOpen] = useState(false);
  const [treasuryCompleteOpen, setTreasuryCompleteOpen] = useState(false);
  const [treasuryRejectOpen, setTreasuryRejectOpen] = useState(false);

  // Document editing state (used when status = DRAFT)
  const [newDocCode, setNewDocCode] = useState('');
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocFileUrl, setNewDocFileUrl] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [docUploadState, setDocUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pr, isLoading } = useQuery({
    queryKey: ['payment-request', id],
    queryFn: () => api.get<PaymentRequest>(`/payment-requests/${id}`),
    enabled: !!id,
  });

  const mut = (path: string, body: unknown) =>
    api.post<PaymentRequest>(`/payment-requests/${id}/${path}`, body ?? {});

  const submitMut = useMutation({
    mutationFn: () => mut('submit', {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); notify.success('Submitted for approval'); },
    onError: (e: Error) => notify.error('Submit failed', e),
  });
  const resubmitMut = useMutation({
    mutationFn: () => mut('resubmit', {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); notify.success('Request returned to draft — you can now edit and resubmit'); },
    onError: (e: Error) => notify.error('Resubmit failed', e),
  });
  const withdrawMut = useMutation({
    mutationFn: () => mut('withdraw', {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); notify.success('Withdrawn'); },
    onError: (e: Error) => notify.error('Withdraw failed', e),
  });
  const approveMut = useMutation({
    mutationFn: (d: ApproveData) => mut('approve', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setApproveOpen(false); notify.success('Approved'); },
    onError: (e: Error) => notify.error('Approve failed', e),
  });
  const rejectMut = useMutation({
    mutationFn: (d: RejectData) => mut('reject', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setRejectOpen(false); notify.success('Rejected'); },
    onError: (e: Error) => notify.error('Reject failed', e),
  });
  const treasurySubmitMut = useMutation({
    mutationFn: (d: TreasurySubmitData) => mut('treasury/submit', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setTreasurySubmitOpen(false); notify.success('Submitted to treasury checker'); },
    onError: (e: Error) => notify.error('Treasury submit failed', e),
  });
  const treasuryCheckMut = useMutation({
    mutationFn: () => mut('treasury/check', {}),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); notify.success('Marked checked'); },
    onError: (e: Error) => notify.error('Check failed', e),
  });
  const treasuryCompleteMut = useMutation({
    // Confidential payments capture the reference + SWIFT/MT103 here; the
    // standard flow already has them from the maker stage and sends nothing.
    mutationFn: (d?: TreasurySubmitData) => mut('treasury/complete', d ?? {}),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: ['payment-request', id] });
      void qc.invalidateQueries({ queryKey: ['bank-accounts-source'] });
      setTreasuryCompleteOpen(false);
      // Notify the authoriser of the resulting bank balance.
      const acct = updated.sourceAccount;
      if (acct) {
        const ccy = updated.currency?.code ? `${updated.currency.code} ` : '';
        const money = (n: number | string): string =>
          `${ccy}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const bank = acct.bankNickname ?? 'the source account';
        notify.success(
          `Payment completed — ${money(updated.amount)} debited from ${bank}. New balance: ${money(acct.remainingBalance)}`,
        );
      } else {
        notify.success('Payment completed');
      }
    },
    onError: (e: Error) => notify.error('Complete failed', e),
  });
  const treasuryRejectMut = useMutation({
    mutationFn: (d: RejectData) => mut('treasury/reject', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setTreasuryRejectOpen(false); notify.success('Rejected — returned to initiator'); },
    onError: (e: Error) => notify.error('Reject failed', e),
  });

  const attachDocMut = useMutation({
    mutationFn: () => api.post(`/payment-requests/${id}/documents`, {
      documentCode: newDocCode.trim().toUpperCase(),
      documentLabel: newDocLabel.trim() || null,
      fileName: newDocFileName,
      fileUrl: newDocFileUrl,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payment-request', id] });
      setNewDocCode(''); setNewDocLabel(''); setNewDocFileUrl(''); setNewDocFileName(''); setDocUploadState('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
      notify.success('Document attached');
    },
    onError: (e: Error) => notify.error('Attach failed', e),
  });

  const removeDocMut = useMutation({
    mutationFn: (documentId: string) => api.del(`/payment-requests/${id}/documents/${documentId}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); notify.success('Document removed'); },
    onError: (e: Error) => notify.error('Remove failed', e),
  });

  async function handleDocFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploadState('uploading');
    try {
      const result = await api.upload(file);
      setNewDocFileUrl(result.url);
      setNewDocFileName(result.fileName);
      setDocUploadState('done');
    } catch (err) {
      setDocUploadState('error');
      notify.error('Upload failed', err instanceof Error ? err : new Error('Upload failed'));
    }
  }

  if (isLoading || !pr) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
        Loading payment request…
      </div>
    );
  }

  const isMine = pr.createdBy === user?.id;
  // Confidential (chairman-style) payments bypass the approval matrix and the
  // treasury maker/checker stages — the authoriser captures the reference +
  // SWIFT/MT103 copy when completing.
  const isConfidential = pr.paymentType?.isConfidential ?? false;
  // Role codes like INITIATOR / CHECKER / APPROVER_1 / APPROVER_2 do not exist
  // in the database. Actual codes are OPS_TEAM, ACCOUNTS_TEAM, APPROVER, etc.
  // The backend enforces all permissions; the frontend uses isMine + canActOnStep.
  const isInitiator = true;  // isMine gates Submit/Withdraw
  const isApprover = true;   // canActOnStep gates Approve/Reject

  // Treasury-stage gating. SUPER_ADMIN may act on any stage (mirrors the
  // backend bypass). The maker role depends on the request's TT mode.
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
  // When the matrix pinned a role to a treasury stage (snapshotted onto the
  // request), gate on that role; otherwise fall back to the global TREASURY_*
  // roles. The backend enforces this regardless — these are display hints.
  const makerRoleNeeded = pr.ttMode === 'OFFLINE_TT' ? 'TREASURY_MAKER_OFFLINE' : 'TREASURY_MAKER_ONLINE';
  const canTreasuryMaker = isSuperAdmin || (pr.treasuryMakerRole
    ? userRoles.includes(pr.treasuryMakerRole.code)
    : userRoles.includes(makerRoleNeeded));
  const canTreasuryChecker = isSuperAdmin || (pr.treasuryCheckerRole
    ? userRoles.includes(pr.treasuryCheckerRole.code)
    : userRoles.includes('TREASURY_CHECKER'));
  const canTreasuryAuthoriser = isSuperAdmin || (pr.treasuryAuthoriserRole
    ? userRoles.includes(pr.treasuryAuthoriserRole.code)
    : userRoles.includes('TREASURY_AUTHORISER'));

  // Active step authorisation hint: for ROLE-steps any holder can act; for
  // USER-steps only the assigned user. The backend re-checks regardless.
  const activeStep = pr.approvals?.find((a) => a.stepOrder === (pr.currentStepOrder ?? -1));
  const canActOnStep =
    activeStep
      ? (activeStep.approverType === 'USER' && activeStep.approverUserId === user?.id) ||
        (activeStep.approverType === 'ROLE' && !!activeStep.approverRole?.code && userRoles.includes(activeStep.approverRole.code))
      : false;

  // Insufficient-balance warning, surfaced at the checker step (step 1 of the
  // approval chain) so the checker can act before the payment proceeds. The
  // balance is only debited at treasury completion, so this is advisory — it
  // never blocks.
  const sourceAcct = pr.sourceAccount;
  const balanceShortfall =
    pr.status === 'PENDING_APPROVAL' && pr.currentStepOrder === 1 && sourceAcct != null
      ? Number(sourceAcct.remainingBalance) - Number(pr.amount) < Number(sourceAcct.minimumBalance)
      : false;

  // Lifecycle buttons — passed as the header `actions` slot of the shared view.
  const actions = (
    <div className="flex gap-2">
      {pr.status === 'DRAFT' && isMine && (
        <Link href={`/payment-requests/${id}/edit`}>
          <Button size="sm" variant="outline">
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
        </Link>
      )}
      {pr.status === 'DRAFT' && isInitiator && isMine && (
        <Button size="sm" onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
          <Send className="mr-1 h-4 w-4" /> Submit
        </Button>
      )}
      {(pr.status === 'DRAFT' || pr.status === 'PENDING_APPROVAL') && isMine && (
        <Button size="sm" variant="outline" onClick={() => withdrawMut.mutate()} disabled={withdrawMut.isPending}>
          <Undo2 className="mr-1 h-4 w-4" /> Withdraw
        </Button>
      )}
      {pr.status === 'REJECTED' && isMine && (
        <Button size="sm" variant="outline" onClick={() => resubmitMut.mutate()} disabled={resubmitMut.isPending}>
          <RefreshCw className="mr-1 h-4 w-4" /> Resubmit
        </Button>
      )}
      {pr.status === 'PENDING_APPROVAL' && isApprover && canActOnStep && (
        <>
          <Button size="sm" onClick={() => setApproveOpen(true)}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejectOpen(true)}>
            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
          </Button>
        </>
      )}
      {pr.status === 'TREASURY_MAKER' && canTreasuryMaker && (
        <>
          <Button size="sm" onClick={() => setTreasurySubmitOpen(true)}>
            <Send className="mr-1 h-4 w-4" /> Submit treasury info
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTreasuryRejectOpen(true)}>
            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
          </Button>
        </>
      )}
      {pr.status === 'TREASURY_CHECKER' && canTreasuryChecker && (
        <>
          <Button size="sm" onClick={() => treasuryCheckMut.mutate()} disabled={treasuryCheckMut.isPending}>
            <BadgeCheck className="mr-1 h-4 w-4" /> Mark checked
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTreasuryRejectOpen(true)}>
            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
          </Button>
        </>
      )}
      {pr.status === 'TREASURY_AUTHORISER' && canTreasuryAuthoriser && (
        <>
          <Button
            size="sm"
            onClick={() => (isConfidential ? setTreasuryCompleteOpen(true) : treasuryCompleteMut.mutate(undefined))}
            disabled={treasuryCompleteMut.isPending}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Mark completed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTreasuryRejectOpen(true)}>
            <XCircle className="mr-1 h-4 w-4 text-destructive" /> Reject
          </Button>
        </>
      )}
    </div>
  );

  // Per-document remove control (only the maker, while editable).
  const canEditDocs = (pr.status === 'DRAFT' || pr.status === 'REJECTED') && isMine;
  const documentActions = (d: PaymentRequestDocument) =>
    canEditDocs ? (
      <button
        type="button"
        className="ml-1 text-destructive hover:text-destructive/80 disabled:opacity-40"
        title="Remove document"
        disabled={removeDocMut.isPending}
        onClick={() => removeDocMut.mutate(d.id)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    ) : null;

  // Add-document UI — in DRAFT or REJECTED (so maker can fix before resubmitting).
  const documentsFooter = canEditDocs ? (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-xs font-medium">Add document</p>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Code (e.g. INVOICE)" value={newDocCode} onChange={(e) => setNewDocCode(e.target.value)} />
        <Input placeholder="Label (optional)" value={newDocLabel} onChange={(e) => setNewDocLabel(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { void handleDocFileChange(e); }}
        />
        <Button size="sm" variant="outline" disabled={docUploadState === 'uploading'} onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" />
          {docUploadState === 'uploading' ? 'Uploading…' : docUploadState === 'done' ? newDocFileName : 'Choose file'}
        </Button>
        {docUploadState === 'error' && <span className="text-xs text-destructive">Upload failed — try again</span>}
        {docUploadState === 'done' && (
          <Button size="sm" disabled={!newDocCode.trim() || attachDocMut.isPending} onClick={() => attachDocMut.mutate()}>
            <Plus className="mr-1 h-4 w-4" />
            {attachDocMut.isPending ? 'Attaching…' : 'Attach'}
          </Button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {balanceShortfall && sourceAcct && (() => {
        const ccy = pr.currency?.code ? `${pr.currency.code} ` : '';
        const money = (n: number | string): string =>
          `${ccy}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const remaining = Number(sourceAcct.remainingBalance);
        const projected = remaining - Number(pr.amount);
        const bank = sourceAcct.bankNickname ?? sourceAcct.bankName ?? 'the source account';
        return (
          <div className="mb-4 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Insufficient balance for this payment</p>
              <p className="text-xs mt-0.5">
                {bank} ({sourceAcct.accountNumber}) has {money(remaining)} available with a{' '}
                {money(sourceAcct.minimumBalance)} minimum balance. This {money(pr.amount)} payment would
                leave {money(projected)}. Review before approving — the balance is debited when treasury completes it.
              </p>
            </div>
          </div>
        );
      })()}
      <PaymentRequestDetailView
        pr={pr}
        backHref="/payment-requests"
        actions={actions}
        documentActions={documentActions}
        documentsFooter={documentsFooter}
      />

      {/* Dialogs --------------------------------------------------- */}
      <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen}
        sanctionWarning={pr.sanctionWarning}
        submitting={approveMut.isPending}
        onSubmit={(d) => approveMut.mutate(d)} />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen}
        submitting={rejectMut.isPending}
        onSubmit={(d) => rejectMut.mutate(d)} />
      <TreasurySubmitDialog open={treasurySubmitOpen} onOpenChange={setTreasurySubmitOpen}
        submitting={treasurySubmitMut.isPending}
        expectedAmount={pr.amount} currencyCode={pr.currency?.code}
        onSubmit={(d) => treasurySubmitMut.mutate(d)} />
      <TreasurySubmitDialog open={treasuryCompleteOpen} onOpenChange={setTreasuryCompleteOpen}
        title="Complete confidential payment"
        description="Capture the bank reference number and attach the SWIFT / MT103 copy, then mark the payment completed."
        submitLabel="Mark completed"
        submittingLabel="Completing…"
        submitting={treasuryCompleteMut.isPending}
        expectedAmount={pr.amount} currencyCode={pr.currency?.code}
        onSubmit={(d) => treasuryCompleteMut.mutate(d)} />
      <RejectDialog open={treasuryRejectOpen} onOpenChange={setTreasuryRejectOpen}
        submitting={treasuryRejectMut.isPending}
        onSubmit={(d) => treasuryRejectMut.mutate(d)} />
    </>
  );
}

// ---------------------------------------------------------------------
// Dialog components
// ---------------------------------------------------------------------

function ApproveDialog({
  open, onOpenChange, sanctionWarning, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sanctionWarning: boolean;
  onSubmit: (d: ApproveData) => void;
  submitting?: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<ApproveData>({ resolver: zodResolver(approveSchema) });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Approve step</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {sanctionWarning && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <ShieldAlert className="mb-1 h-4 w-4" />
              §6.5 — beneficiary country is sanctioned. The final approver must record an override reason.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" rows={2} {...register('comments')} />
          </div>
          {sanctionWarning && (
            <div className="space-y-2">
              <Label htmlFor="sanctionOverrideReason">Sanction override reason</Label>
              <Textarea id="sanctionOverrideReason" rows={3} {...register('sanctionOverrideReason')} />
            </div>
          )}
          <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? 'Approving…' : 'Approve'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: RejectData) => void;
  submitting?: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RejectData>({ resolver: zodResolver(rejectSchema) });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject request</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comments">Reason <span className="text-destructive">*</span></Label>
            <Textarea id="comments" rows={3} {...register('comments')} />
            {errors.comments && <p className="text-xs text-destructive">{errors.comments.message}</p>}
          </div>
          <DialogFooter><Button type="submit" variant="destructive" disabled={submitting}>Reject</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TreasurySubmitDialog({
  open, onOpenChange, onSubmit, submitting,
  title = 'Submit treasury info',
  description = 'Capture the bank reference number and attach the SWIFT / MT103 copy received from the bank.',
  submitLabel = 'Submit',
  submittingLabel = 'Submitting…',
  expectedAmount,
  currencyCode,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: TreasurySubmitData) => void;
  submitting?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  /** Approved request amount, cross-checked against the SWIFT/MT103 copy. */
  expectedAmount?: string | null;
  currencyCode?: string | null;
}) {
  const notify = useNotify();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  // Warn-only auto-read of the uploaded SWIFT/MT103 copy. Advisory; never blocks.
  const [extraction, setExtraction] = useState<ExtractedRemittance | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<TreasurySubmitData>({ resolver: zodResolver(treasurySubmitSchema) });

  function resetAll() {
    reset();
    setUploadState('idle');
    setFileName('');
    setExtraction(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setExtraction(null);
    try {
      const result = await api.upload(file);
      setValue('swiftCopyUrl', result.url, { shouldValidate: true });
      setFileName(result.fileName);
      setUploadState('done');
      // Fire-and-forget auto-read (PDFs only). Failures are silent — the
      // cross-check is optional and must not affect the upload.
      if (file.type === 'application/pdf') {
        api.extractRemittance(file).then(setExtraction).catch(() => { /* best-effort */ });
      }
    } catch (err) {
      setUploadState('error');
      notify.error('Upload failed', err instanceof Error ? err : new Error('Upload failed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAll(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference number <span className="text-destructive">*</span></Label>
            <Input id="referenceNumber" placeholder="e.g. FT26154ABCD" {...register('referenceNumber')} />
            {errors.referenceNumber && <p className="text-xs text-destructive">{errors.referenceNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>SWIFT / MT103 copy <span className="text-destructive">*</span></Label>
            <input type="hidden" {...register('swiftCopyUrl')} />
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { void handleFile(e); }} />
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="button" size="sm" variant="outline" disabled={uploadState === 'uploading'} onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" />
                {uploadState === 'uploading' ? 'Uploading…' : uploadState === 'done' ? fileName : 'Choose file'}
              </Button>
              {uploadState === 'error' && <span className="text-xs text-destructive">Upload failed — try again</span>}
            </div>
            {errors.swiftCopyUrl && <p className="text-xs text-destructive">{errors.swiftCopyUrl.message}</p>}
          </div>

          {/* Warn-only SWIFT/MT103 auto-read cross-check. */}
          {extraction && (() => {
            if (!extraction.readable) {
              return (
                <div className="rounded-md border border-muted bg-muted/40 p-2 text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{extraction.reason ?? 'Could not auto-read this copy. Please verify manually.'}</span>
                </div>
              );
            }
            const rows = compareRemittance(extraction, {
              referenceNumber: watch('referenceNumber'),
              amount: expectedAmount ?? undefined,
            });
            if (rows.length === 0) {
              return (
                <div className="rounded-md border border-muted bg-muted/40 p-2 text-xs text-muted-foreground">
                  Copy read, but no reference or amount could be identified to compare.
                </div>
              );
            }
            const anyMismatch = rows.some((r) => r.status === 'mismatch');
            return (
              <div className={`rounded-md border p-2 text-xs space-y-1 ${anyMismatch ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                <p className="font-medium flex items-center gap-1.5">
                  {anyMismatch
                    ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  {anyMismatch ? 'SWIFT/MT103 copy does not match' : 'SWIFT/MT103 copy matches'}
                </p>
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="flex items-center gap-2">
                      <span>expected: <b>{r.label === 'Amount' && currencyCode ? `${currencyCode} ` : ''}{r.expected}</b></span>
                      <span>document: <b>{r.label === 'Amount' && currencyCode ? `${currencyCode} ` : ''}{r.document}</b></span>
                      {r.status === 'match'
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground pt-1">
                  Auto-read is advisory and may be inaccurate — it does not block submission.
                </p>
              </div>
            );
          })()}

          <DialogFooter>
            <Button type="submit" disabled={submitting || uploadState === 'uploading'}>
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
