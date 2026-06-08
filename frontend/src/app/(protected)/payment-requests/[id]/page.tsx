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
import { api, resolveFileUrl } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import type { PaymentRequest } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { useAuth } from '@/hooks/use-auth';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground ring-border',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-amber-200',
  TREASURY_MAKER: 'bg-blue-50 text-blue-700 ring-blue-200',
  TREASURY_CHECKER: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  TREASURY_AUTHORISER: 'bg-violet-50 text-violet-700 ring-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
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

const treasurySubmitSchema = z.object({
  referenceNumber: z.string().min(1, 'Reference number required'),
  swiftCopyUrl: z.string().min(1, 'SWIFT / MT103 copy required'),
});
type TreasurySubmitData = z.infer<typeof treasurySubmitSchema>;

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
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['payment-request', id] }); setTreasuryCompleteOpen(false); notify.success('Payment completed'); },
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
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Header */}
        <Card className="order-1 col-span-2">
          <CardHeader><CardTitle>Request</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Payment type" value={pr.paymentType?.name ?? '—'} />
            <Field label="Legal entity" value={pr.paymentType?.legalEntity?.name ?? '—'} />
            <Field label="Counterparty" value={pr.counterparty?.legalName ?? pr.employee?.fullName ?? '—'} />
            <Field label="Currency" value={pr.currency?.code ?? '—'} />
            <Field label="Amount" value={Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
            <Field label="Invoice #" value={pr.invoiceNumber ?? '—'} />
            <Field label="Due date" value={pr.dueDate ?? '—'} />
            <Field label="Beneficiary" value={pr.beneficiaryAccount?.accountHolderName ?? '—'} />
            <Field label="Beneficiary acc #" value={pr.beneficiaryAccount?.accountNumber ?? '—'} />
            {pr.sourceAccount && (
              <Field label="Source account" value={`${pr.sourceAccount.bank?.name ?? pr.sourceAccount.bankName ?? ''} · ${pr.sourceAccount.accountNumber}`} />
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
        <Card className="order-3 col-span-3">
          <CardHeader><CardTitle>Approval chain</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {isConfidential ? (
              <p className="text-muted-foreground">
                Confidential (chairman-style) payment — no approval chain. Routed directly to the Treasury Authoriser.
              </p>
            ) : !pr.approvals?.length ? (
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
                          {step.decidedByUser?.fullName ?? '—'} · {formatDateTime(step.decidedAt)}
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

        {/* Treasury Team chain */}
        {(pr.ttMode || isConfidential) && (
          <Card className="order-4 col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Treasury Team chain
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                  {isConfidential ? 'Confidential' : pr.ttMode === 'OFFLINE_TT' ? 'Offline TT' : 'Online TT'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ol className="space-y-2">
                {treasurySteps(pr, isConfidential).map((step) => {
                  const ringStyle =
                    step.state === 'DONE' ? 'bg-emerald-50 ring-emerald-200' :
                    step.state === 'REJECTED' ? 'bg-rose-50 ring-rose-200' :
                    step.state === 'ACTIVE' ? 'bg-amber-50 ring-amber-200' :
                    'bg-muted ring-border';
                  return (
                    <li key={step.order} className={`rounded-md px-3 py-2 ring-1 ${ringStyle}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-medium">
                            {step.order}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">{step.role}</span>
                          <span className="font-medium">{step.label}</span>
                        </div>
                        <span className="text-xs">{step.badge}</span>
                      </div>
                      {step.roleName && (
                        <div className="mt-1 text-xs text-muted-foreground">Role: {step.roleName}</div>
                      )}
                      {step.actor && step.at && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {step.actor} · {formatDateTime(step.at)}
                        </div>
                      )}
                      {step.detail && (
                        <div className="mt-1 text-xs whitespace-pre-wrap">{step.detail}</div>
                      )}
                      {step.order === 1 && pr.swiftCopyUrl && (
                        <div className="mt-1">
                          <a className="text-xs underline text-muted-foreground" href={resolveFileUrl(pr.swiftCopyUrl)} target="_blank" rel="noreferrer">
                            Open SWIFT / MT103 copy
                          </a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card className="order-2 col-span-1">
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
      <TreasurySubmitDialog open={treasurySubmitOpen} onOpenChange={setTreasurySubmitOpen}
        submitting={treasurySubmitMut.isPending}
        onSubmit={(d) => treasurySubmitMut.mutate(d)} />
      <TreasurySubmitDialog open={treasuryCompleteOpen} onOpenChange={setTreasuryCompleteOpen}
        title="Complete confidential payment"
        description="Capture the bank reference number and attach the SWIFT / MT103 copy, then mark the payment completed."
        submitLabel="Mark completed"
        submittingLabel="Completing…"
        submitting={treasuryCompleteMut.isPending}
        onSubmit={(d) => treasuryCompleteMut.mutate(d)} />
      <RejectDialog open={treasuryRejectOpen} onOpenChange={setTreasuryRejectOpen}
        submitting={treasuryRejectMut.isPending}
        onSubmit={(d) => treasuryRejectMut.mutate(d)} />
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

type TtStepView = {
  order: number;
  role: string;
  label: string;
  badge: string;
  state: 'DONE' | 'ACTIVE' | 'REJECTED' | 'PENDING';
  actor: string | null;
  at: string | null;
  detail: string | null;
  /** Role pinned to this stage by the approval matrix, if any. */
  roleName: string | null;
};

/**
 * Builds the Treasury Team timeline (maker → checker → authoriser) from the
 * request's treasury fields, mirroring the approval-chain display. A treasury
 * reject marks the first not-yet-completed stage as REJECTED. The same person
 * may legitimately appear on more than one stage.
 */
function treasurySteps(pr: PaymentRequest, isConfidential = false): TtStepView[] {
  // Confidential (chairman-style) payments have a single treasury stage: the
  // authoriser, who captures the reference + SWIFT/MT103 and completes.
  if (isConfidential) {
    const done = !!pr.treasuryAuthoriserAt;
    const active = pr.status === 'TREASURY_AUTHORISER';
    const rejected = pr.status === 'REJECTED' && !done;
    const state: TtStepView['state'] = done ? 'DONE' : rejected ? 'REJECTED' : active ? 'ACTIVE' : 'PENDING';
    let detail: string | null = null;
    if (pr.treasuryReferenceNumber) detail = `Reference: ${pr.treasuryReferenceNumber}`;
    if (rejected && pr.rejectionReason) detail = pr.rejectionReason;
    return [
      {
        order: 1,
        role: 'AUTHORISER',
        label: 'Treasury Authoriser',
        badge: done ? 'COMPLETED' : rejected ? 'REJECTED' : active ? 'PENDING' : '—',
        state,
        actor: pr.treasuryAuthoriserByUser?.fullName ?? null,
        at: pr.treasuryAuthoriserAt ?? null,
        detail,
        roleName: pr.treasuryAuthoriserRole?.name ?? null,
      },
    ];
  }
  const stages = [
    { order: 1, role: 'MAKER', label: 'Treasury Maker', user: pr.treasuryMakerByUser, at: pr.treasuryMakerAt, activeStatus: 'TREASURY_MAKER', doneBadge: 'SUBMITTED' },
    { order: 2, role: 'CHECKER', label: 'Treasury Checker', user: pr.treasuryCheckerByUser, at: pr.treasuryCheckerAt, activeStatus: 'TREASURY_CHECKER', doneBadge: 'CHECKED' },
    { order: 3, role: 'AUTHORISER', label: 'Treasury Authoriser', user: pr.treasuryAuthoriserByUser, at: pr.treasuryAuthoriserAt, activeStatus: 'TREASURY_AUTHORISER', doneBadge: 'COMPLETED' },
  ] as const;
  // A REJECTED status only belongs to the treasury chain when the rejection
  // happened *during* the treasury flow. If any approval-chain step was
  // rejected, the request never reached treasury, so no treasury stage is the
  // culprit — leave them all PENDING instead of blaming the maker.
  const approvalChainRejected = pr.approvals?.some((a) => a.decision === 'REJECTED') ?? false;
  const rejectedIdx =
    pr.status === 'REJECTED' && !approvalChainRejected
      ? stages.findIndex((s) => !s.at)
      : -1;
  return stages.map((s, i) => {
    const done = !!s.at;
    const active = pr.status === s.activeStatus;
    const rejected = i === rejectedIdx;
    const state: TtStepView['state'] = done ? 'DONE' : rejected ? 'REJECTED' : active ? 'ACTIVE' : 'PENDING';
    const badge = done ? s.doneBadge : rejected ? 'REJECTED' : active ? 'PENDING' : '—';
    let detail: string | null = null;
    if (s.order === 1 && pr.treasuryReferenceNumber) detail = `Reference: ${pr.treasuryReferenceNumber}`;
    if (rejected && pr.rejectionReason) detail = pr.rejectionReason;
    const roleName =
      s.role === 'MAKER' ? pr.treasuryMakerRole?.name
      : s.role === 'CHECKER' ? pr.treasuryCheckerRole?.name
      : pr.treasuryAuthoriserRole?.name;
    return {
      order: s.order,
      role: s.role,
      label: s.label,
      badge,
      state,
      actor: s.user?.fullName ?? null,
      at: s.at ?? null,
      detail,
      roleName: roleName ?? null,
    };
  });
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: TreasurySubmitData) => void;
  submitting?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const notify = useNotify();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<TreasurySubmitData>({ resolver: zodResolver(treasurySubmitSchema) });

  function resetAll() {
    reset();
    setUploadState('idle');
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    try {
      const result = await api.upload(file);
      setValue('swiftCopyUrl', result.url, { shouldValidate: true });
      setFileName(result.fileName);
      setUploadState('done');
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
