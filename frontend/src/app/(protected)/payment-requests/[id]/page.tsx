'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Loader2,
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
import { api, resolveFileUrl } from '@/lib/api';
import type { BankAccount, Paginated, PaymentRequest } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { useAuth } from '@/hooks/use-auth';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground ring-border',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 ring-blue-200',
  AWAITING_PAYMENT_CONFIRMATION: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-muted text-muted-foreground ring-border',
  CANCELLED: 'bg-muted text-muted-foreground ring-border',
};

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

const releaseSchema = z.object({ sourceAccountId: z.string().uuid('Select a source account') });
type ReleaseData = z.infer<typeof releaseSchema>;

const markPaidSchema = z.object({
  bankReference: z.string().min(1, 'Bank reference required'),
  valueDate: z.string().min(1, 'Value date required'),
});
type MarkPaidData = z.infer<typeof markPaidSchema>;

const proofSchema = z.object({ proofOfPaymentUrl: z.string().min(1, 'URL required') });
type ProofData = z.infer<typeof proofSchema>;

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
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

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

  // Source accounts (filtered to the request's currency on the form below)
  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts-all'],
    queryFn: () => api.get<Paginated<BankAccount>>('/bank-accounts?page=1&limit=200'),
    enabled: pr?.status === 'APPROVED',
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
  const releaseMut = useMutation({
    mutationFn: (d: ReleaseData) => mut('release', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setReleaseOpen(false); notify.success('Released to bank'); },
    onError: (e: Error) => notify.error('Release failed', e),
  });
  const markPaidMut = useMutation({
    mutationFn: (d: MarkPaidData) => mut('mark-paid', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setPaidOpen(false); notify.success('Marked paid'); },
    onError: (e: Error) => notify.error('Mark-paid failed', e),
  });
  const proofMut = useMutation({
    mutationFn: (d: ProofData) => mut('upload-proof', d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setProofOpen(false); notify.success('Proof uploaded'); },
    onError: (e: Error) => notify.error('Upload failed', e),
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
  // Role codes like INITIATOR / CHECKER / APPROVER_1 / APPROVER_2 do not exist
  // in the database. Actual codes are OPS_TEAM, ACCOUNTS_TEAM, APPROVER, etc.
  // The backend enforces all permissions; the frontend uses isMine + canActOnStep.
  const isInitiator = true;  // isMine gates Submit/Withdraw
  const isApprover = true;   // canActOnStep gates Approve/Reject
  const isMaker = isMine;    // creator is the maker for Release/Mark-paid

  // Active step authorisation hint: for ROLE-steps any holder can act; for
  // USER-steps only the assigned user. The backend re-checks regardless.
  const activeStep = pr.approvals?.find((a) => a.stepOrder === (pr.currentStepOrder ?? -1));
  const canActOnStep =
    activeStep
      ? (activeStep.approverType === 'USER' && activeStep.approverUserId === user?.id) ||
        (activeStep.approverType === 'ROLE' && !!activeStep.approverRole?.code && userRoles.includes(activeStep.approverRole.code))
      : false;

  // The final approver must not reject — all prior checks are complete.
  const totalSteps = pr.approvals?.length ?? 0;
  const isFinalStep = totalSteps > 0 && (pr.currentStepOrder ?? 0) === totalSteps;

  // Filter source accounts to the request currency.
  const sourceAccountOptions = (bankAccounts?.data ?? [])
    .filter((a) => a.currencyId === pr.currencyId && a.isActive)
    .map((a) => ({
      label: `${a.bank?.name ?? a.bankName ?? 'Bank'} · ${a.accountNumber} · remaining ${Number(a.remainingBalance).toLocaleString()}`,
      value: a.id,
    }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/payment-requests">
          <Button size="icon" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{pr.requestNumber}</h1>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[pr.status]}`}>
          {pr.status.replace(/_/g, ' ')}
        </span>
        {pr.sanctionWarning && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            <ShieldAlert className="h-3 w-3" /> Sanctioned country
          </span>
        )}
        {pr.anomalyFlag && (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-200">
            <AlertTriangle className="h-3 w-3" /> Anomaly detected
          </span>
        )}
      </div>
      <PageHeader
        title={pr.paymentType?.name ?? 'Payment request'}
        description={pr.paymentType?.description ?? undefined}
        actions={
          <div className="flex gap-2">
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
            {pr.status === 'APPROVED' && isMaker && (
              <Button size="sm" onClick={() => setReleaseOpen(true)}>
                <Send className="mr-1 h-4 w-4" /> Release to bank
              </Button>
            )}
            {pr.status === 'AWAITING_PAYMENT_CONFIRMATION' && isMaker && (
              <Button size="sm" onClick={() => setPaidOpen(true)}>
                <BadgeCheck className="mr-1 h-4 w-4" /> Mark paid
              </Button>
            )}
            {(pr.status === 'PAID' || pr.status === 'AWAITING_PAYMENT_CONFIRMATION') && isMaker && (
              <Button size="sm" variant="outline" onClick={() => setProofOpen(true)}>
                <Upload className="mr-1 h-4 w-4" /> Proof of payment
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Header */}
        <Card className="col-span-2">
          <CardHeader><CardTitle>Request</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Legal entity" value={pr.legalEntity?.name ?? '—'} />
            <Field label="Counterparty" value={pr.counterparty?.legalName ?? pr.employee?.fullName ?? '—'} />
            <Field label="Currency" value={pr.currency?.code ?? '—'} />
            <Field label="Amount" value={Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
            <Field label="Invoice #" value={pr.invoiceNumber ?? '—'} />
            <Field label="Due date" value={pr.dueDate ?? '—'} />
            <Field label="Beneficiary" value={pr.beneficiaryAccount?.accountHolderName ?? '—'} />
            <Field label="Beneficiary acc #" value={pr.beneficiaryAccount?.accountNumber ?? '—'} />
            {pr.sourceAccount && (
              <>
                <Field label="Source account" value={`${pr.sourceAccount.bank?.name ?? pr.sourceAccount.bankName ?? ''} · ${pr.sourceAccount.accountNumber}`} />
                <Field label="Bank reference" value={pr.bankReference ?? '—'} />
                <Field label="Value date" value={pr.valueDate ?? '—'} />
                <Field label="Proof of payment" value={pr.proofOfPaymentUrl ?? '—'} />
              </>
            )}
            {pr.purposeDescription && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Purpose</p>
                <p className="whitespace-pre-wrap">{pr.purposeDescription}</p>
              </div>
            )}
            {pr.rejectionReason && (
              <div className="col-span-2 rounded-md bg-rose-50 p-2 text-xs text-rose-800">
                <strong>Rejection reason:</strong> {pr.rejectionReason}
              </div>
            )}
            {pr.anomalyNotes && (
              <div className="col-span-2 rounded-md bg-orange-50 p-3 text-xs text-orange-900 ring-1 ring-orange-200">
                <p className="mb-1 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-3 w-3" /> §6.4 Anomaly flags
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {pr.anomalyNotes.split('\n').map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval chain */}
        <Card>
          <CardHeader><CardTitle>Approval chain</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {!pr.approvals?.length ? (
              <p className="text-muted-foreground">Chain is generated on submit.</p>
            ) : (
              <ol className="space-y-2">
                {pr.approvals.map((step) => {
                  const isActive = step.stepOrder === (pr.currentStepOrder ?? -1);
                  const ringStyle =
                    step.decision === 'APPROVED' ? 'bg-emerald-50 ring-emerald-200' :
                    step.decision === 'REJECTED' ? 'bg-rose-50 ring-rose-200' :
                    isActive ? 'bg-amber-50 ring-amber-200' :
                    'bg-muted ring-border';
                  return (
                    <li key={step.id} className={`rounded-md px-3 py-2 ring-1 ${ringStyle}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-medium">
                            {step.stepOrder}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">{step.approverType}</span>
                          <span className="font-medium">
                            {step.approverType === 'USER'
                              ? step.approverUser?.fullName ?? step.approverUserId
                              : step.approverRole?.name ?? step.approverRoleId}
                          </span>
                        </div>
                        <span className="text-xs">{step.decision}</span>
                      </div>
                      {step.decidedAt && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {step.decidedByUser?.fullName ?? '—'} · {new Date(step.decidedAt).toLocaleString()}
                        </div>
                      )}
                      {step.comments && (
                        <div className="mt-1 text-xs whitespace-pre-wrap">{step.comments}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="col-span-3">
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!pr.documents?.length ? (
              <p className="text-sm text-muted-foreground">No documents attached.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {pr.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{d.documentCode}</code>
                    <span>{d.documentLabel ?? d.fileName}</span>
                    <a className="ml-auto text-xs underline text-muted-foreground" href={resolveFileUrl(d.fileUrl)} target="_blank" rel="noreferrer">
                      Open
                    </a>
                    {(pr.status === 'DRAFT' || pr.status === 'REJECTED') && isMine && (
                      <button
                        type="button"
                        className="ml-1 text-destructive hover:text-destructive/80 disabled:opacity-40"
                        title="Remove document"
                        disabled={removeDocMut.isPending}
                        onClick={() => removeDocMut.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add document — in DRAFT or REJECTED (so maker can fix before resubmitting) */}
            {(pr.status === 'DRAFT' || pr.status === 'REJECTED') && isMine && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-xs font-medium">Add document</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Code (e.g. INVOICE)"
                    value={newDocCode}
                    onChange={(e) => setNewDocCode(e.target.value)}
                  />
                  <Input
                    placeholder="Label (optional)"
                    value={newDocLabel}
                    onChange={(e) => setNewDocLabel(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => { void handleDocFileChange(e); }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={docUploadState === 'uploading'}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    {docUploadState === 'uploading' ? 'Uploading…' : docUploadState === 'done' ? newDocFileName : 'Choose file'}
                  </Button>
                  {docUploadState === 'error' && (
                    <span className="text-xs text-destructive">Upload failed — try again</span>
                  )}
                  {docUploadState === 'done' && (
                    <Button
                      size="sm"
                      disabled={!newDocCode.trim() || attachDocMut.isPending}
                      onClick={() => attachDocMut.mutate()}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {attachDocMut.isPending ? 'Attaching…' : 'Attach'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs --------------------------------------------------- */}
      <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen}
        sanctionWarning={pr.sanctionWarning}
        submitting={approveMut.isPending}
        onSubmit={(d) => approveMut.mutate(d)} />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen}
        submitting={rejectMut.isPending}
        onSubmit={(d) => rejectMut.mutate(d)} />
      <ReleaseDialog open={releaseOpen} onOpenChange={setReleaseOpen}
        options={sourceAccountOptions}
        submitting={releaseMut.isPending}
        onSubmit={(d) => releaseMut.mutate(d)} />
      <MarkPaidDialog open={paidOpen} onOpenChange={setPaidOpen}
        submitting={markPaidMut.isPending}
        onSubmit={(d) => markPaidMut.mutate(d)} />
      <ProofDialog open={proofOpen} onOpenChange={setProofOpen}
        submitting={proofMut.isPending}
        onSubmit={(d) => proofMut.mutate(d)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
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

function ReleaseDialog({
  open, onOpenChange, options, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  options: { label: string; value: string }[];
  onSubmit: (d: ReleaseData) => void;
  submitting?: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReleaseData>({ resolver: zodResolver(releaseSchema) });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release to bank</DialogTitle>
          <p className="text-xs text-muted-foreground">§4.3 — select the source account. Same-currency only in MVP; balance must stay above minimum.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceAccountId">Source account <span className="text-destructive">*</span></Label>
            <Select id="sourceAccountId" placeholder="Select source account" options={options} {...register('sourceAccountId')} />
            {errors.sourceAccountId && <p className="text-xs text-destructive">{errors.sourceAccountId.message}</p>}
          </div>
          <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? 'Releasing…' : 'Release'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: MarkPaidData) => void;
  submitting?: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarkPaidData>({ resolver: zodResolver(markPaidSchema) });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark paid</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankReference">Bank reference (UTR / wire ID) <span className="text-destructive">*</span></Label>
            <Input id="bankReference" {...register('bankReference')} />
            {errors.bankReference && <p className="text-xs text-destructive">{errors.bankReference.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="valueDate">Value date <span className="text-destructive">*</span></Label>
            <Input id="valueDate" type="date" {...register('valueDate')} />
            {errors.valueDate && <p className="text-xs text-destructive">{errors.valueDate.message}</p>}
          </div>
          <DialogFooter><Button type="submit" disabled={submitting}>Mark paid</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProofDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: ProofData) => void;
  submitting?: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProofData>({ resolver: zodResolver(proofSchema) });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload proof of payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proofOfPaymentUrl">Proof URL <span className="text-destructive">*</span></Label>
            <Input id="proofOfPaymentUrl" placeholder="/uploads/mt103.pdf" {...register('proofOfPaymentUrl')} />
            {errors.proofOfPaymentUrl && <p className="text-xs text-destructive">{errors.proofOfPaymentUrl.message}</p>}
          </div>
          <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? 'Uploading…' : 'Upload'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
