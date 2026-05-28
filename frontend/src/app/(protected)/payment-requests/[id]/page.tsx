'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Paperclip,
  Plus,
  Send,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api, friendlyError, resolveFileUrl } from '@/lib/api';
import type {
  BankAccount,
  Paginated,
  PaymentRequest,
  PaymentRequestApproval,
  PaymentRequestDocument,
  PaymentRequestStatus,
  SanctionedCountry,
} from '@/types/domain';
import { useAuth } from '@/hooks/use-auth';
import { RoleCode } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';

const STATUS_STYLE: Record<PaymentRequestStatus, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-700',
  PENDING_APPROVAL: 'bg-blue-500/10 text-blue-700',
  APPROVED: 'bg-green-500/10 text-green-700',
  AWAITING_PAYMENT_CONFIRMATION: 'bg-purple-500/10 text-purple-700',
  PAID: 'bg-green-700/10 text-green-800',
  REJECTED: 'bg-red-500/10 text-red-700',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
  // §9 — Chairman payment execution stages
  AWAITING_MAKER_PREP: 'bg-amber-600/10 text-amber-800',
  AWAITING_CHECKER_REVIEW: 'bg-blue-600/10 text-blue-800',
  AWAITING_HEAD_APPROVAL: 'bg-violet-500/10 text-violet-700',
};

const STATUS_LABEL: Partial<Record<PaymentRequestStatus, string>> = {
  AWAITING_MAKER_PREP: 'Awaiting Preparation',
  AWAITING_CHECKER_REVIEW: 'Awaiting Verification',
  AWAITING_HEAD_APPROVAL: 'Awaiting Head Approval',
};

const DECISION_ICON = {
  PENDING: <Clock className="h-4 w-4 text-muted-foreground" />,
  APPROVED: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-600" />,
};

function Field({ label, value }: { label: string; value?: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  );
}

export default function PaymentRequestDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();
  const { user } = useAuth();

  // §9 — Role-based flags for chairman payment UI gating.
  // The legacy PAYMENTS_MAKER/CHECKER/HEAD/CHAIRMAN roles no longer exist
  // in the trimmed role set; these flags stay for the gating expressions
  // below but resolve to false until that workflow is re-mapped onto the
  // current role taxonomy.
  const userRoles: string[] = user?.roles ?? [];
  const hasMakerRole = userRoles.includes('PAYMENTS_MAKER');
  const hasCheckerRole = userRoles.includes('PAYMENTS_CHECKER');
  const hasHeadRole = userRoles.includes('PAYMENTS_HEAD');
  const isChairmanRole = userRoles.includes('CHAIRMAN');
  const isSuperAdmin = userRoles.includes(RoleCode.SUPER_ADMIN);
  const canSeeConfidential = hasMakerRole || hasCheckerRole || hasHeadRole || isSuperAdmin;

  // Dialog states
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);

  // §9 — Chairman execution dialog states
  const [chairmanSubmitOpen, setChairmanSubmitOpen] = useState(false);
  const [chairmanPrepareOpen, setChairmanPrepareOpen] = useState(false);
  const [chairmanVerifyOpen, setChairmanVerifyOpen] = useState(false);
  const [chairmanApproveOpen, setChairmanApproveOpen] = useState(false);

  // Form fields
  const [approveComment, setApproveComment] = useState('');
  const [sanctionAcknowledgement, setSanctionAcknowledgement] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [releaseAccountId, setReleaseAccountId] = useState('');
  const [makerNotes, setMakerNotes] = useState('');

  // §9 — Chairman execution form fields
  const [chairmanSourceAccountId, setChairmanSourceAccountId] = useState('');
  const [chairmanMakerNotes, setChairmanMakerNotes] = useState('');
  const [checkerNotes, setCheckerNotes] = useState('');
  const [chairmanApproveComments, setChairmanApproveComments] = useState('');

  // Add-document (DRAFT only)
  const [addDocCode, setAddDocCode] = useState('');
  const [addDocLabel, setAddDocLabel] = useState('');
  const [addDocFileName, setAddDocFileName] = useState('');
  const [addDocFileUrl, setAddDocFileUrl] = useState('');
  const [addDocMime, setAddDocMime] = useState('');
  const [addDocUploading, setAddDocUploading] = useState(false);

  // Maker verification checklist (Release to Bank step)
  const RELEASE_CHECKLIST = [
    'I have verified the beneficiary account details match the supporting documents.',
    'I confirm the payment amount and currency are correct.',
    'I have reviewed all attached supporting documents.',
    'I confirm the source account has sufficient balance for this payment.',
  ] as const;
  const [releaseChecked, setReleaseChecked] = useState<Set<number>>(new Set());
  const allReleaseChecked = releaseChecked.size === RELEASE_CHECKLIST.length;
  const [bankRef, setBankRef] = useState('');
  const [valueDate, setValueDate] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofUploading, setProofUploading] = useState(false);

  const { data: pr, isLoading } = useQuery({
    queryKey: ['payment-requests', id],
    queryFn: () => api.get<PaymentRequest>(`/payment-requests/${id}`),
    enabled: !!id,
  });

  const { data: approvals } = useQuery({
    queryKey: ['payment-requests', id, 'approvals'],
    queryFn: () => api.get<PaymentRequestApproval[]>(`/payment-requests/${id}/approvals`),
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ['payment-requests', id, 'documents'],
    queryFn: () => api.get<PaymentRequestDocument[]>(`/payment-requests/${id}/documents`),
    enabled: !!id,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts-selectable', pr?.legalEntityId],
    queryFn: () =>
      api.get<Paginated<BankAccount>>(
        `/bank-accounts?legalEntityId=${pr!.legalEntityId}&accountType=CURRENT&isActive=true&limit=100`,
      ),
    enabled: !!pr?.legalEntityId,
  });

  /** §4.2 — Recent payment history for this counterparty (last 5 paid requests). */
  const { data: counterpartyHistory } = useQuery({
    queryKey: ['payment-requests-counterparty-history', pr?.counterpartyId],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        `/payment-requests?counterpartyId=${pr!.counterpartyId}&status=PAID&page=1&limit=5`,
      ),
    enabled: !!pr?.counterpartyId,
  });

  /** §4.2 — Sanctioned countries list for screening warnings on the approver view. */
  const { data: sanctionedCountriesData } = useQuery({
    queryKey: ['sanctioned-countries-all'],
    queryFn: () => api.get<Paginated<SanctionedCountry>>('/sanctioned-countries?page=1&limit=100'),
  });

  const sanctionedSet = new Set(
    (sanctionedCountriesData?.data ?? [])
      .filter((s) => s.isActive)
      .map((s) => s.countryCode.toUpperCase()),
  );

  // Check if the beneficiary account's country or counterparty's country is sanctioned.
  // The backend also stamps pr.sanctionWarning at submit time as the authoritative flag.
  const isBeneSanctioned =
    !!pr?.beneficiaryAccount && sanctionedSet.has(pr.beneficiaryAccount.countryCode.toUpperCase());
  const isCounterpartySanctioned =
    !!pr?.counterparty && sanctionedSet.has(pr.counterparty.countryCode.toUpperCase());
  const hasSanctionWarning = pr?.sanctionWarning || isBeneSanctioned || isCounterpartySanctioned;

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['payment-requests', id] });

  const submitMutation = useMutation({
    mutationFn: () => api.post<PaymentRequest>(`/payment-requests/${id}/submit`),
    onSuccess: () => { invalidate(); notify.success('Submitted for approval'); },
    onError: (e: Error) => notify.error('Submit failed'),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/approve`, {
        comments: approveComment,
        sanctionAcknowledgement: sanctionAcknowledgement.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: ['payment-requests', id, 'approvals'] });
      setApproveOpen(false);
      setSanctionAcknowledgement('');
      notify.success('Approved successfully');
    },
    onError: (e: Error) => notify.error('Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: ['payment-requests', id, 'approvals'] });
      setRejectOpen(false);
      notify.success('Request rejected');
    },
    onError: (e: Error) => notify.error('Rejection failed'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/withdraw`, { reason: withdrawReason }),
    onSuccess: () => {
      invalidate();
      setWithdrawOpen(false);
      notify.success('Request withdrawn');
    },
    onError: (e: Error) => notify.error('Withdraw failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/cancel`, { reason: cancelReason }),
    onSuccess: () => {
      invalidate();
      setCancelOpen(false);
      notify.success('Request cancelled');
    },
    onError: (e: Error) => notify.error('Cancel failed'),
  });

  const releaseMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/release`, {
        sourceAccountId: releaseAccountId,
        makerNotes: makerNotes || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReleaseOpen(false);
      notify.success('Released to bank');
    },
    onError: (e: Error) => notify.error('Release failed'),
  });

  const markPaidMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/mark-paid`, {
        bankReference: bankRef,
        valueDate,
        proofOfPaymentUrl: proofUrl || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setPaidOpen(false);
      notify.success('Marked as Paid');
    },
    onError: (e: Error) => notify.error('Mark paid failed'),
  });

  // §9 — Chairman-designated accounts for the Prepare dialog
  const { data: chairmanAccounts } = useQuery({
    queryKey: ['bank-accounts-chairman', pr?.legalEntityId],
    queryFn: () =>
      api.get<Paginated<BankAccount>>(
        `/bank-accounts?legalEntityId=${pr!.legalEntityId}&isChairmanDesignated=true&isActive=true&limit=100`,
      ),
    enabled: !!pr?.legalEntityId && !!pr.isChairmanPayment && chairmanPrepareOpen,
  });

  const chairmanSubmitMutation = useMutation({
    mutationFn: () => api.post<PaymentRequest>(`/payment-requests/${id}/chairman-submit`),
    onSuccess: () => {
      invalidate();
      setChairmanSubmitOpen(false);
      notify.success('Sent to Payments Team');
    },
    onError: (e: Error) => notify.error('Submit failed'),
  });

  const chairmanPrepareMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/chairman-prepare`, {
        sourceAccountId: chairmanSourceAccountId,
        makerNotes: chairmanMakerNotes.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setChairmanPrepareOpen(false);
      setChairmanSourceAccountId('');
      setChairmanMakerNotes('');
      notify.success('TT prepared');
    },
    onError: (e: Error) => notify.error('Prepare failed'),
  });

  const chairmanVerifyMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/chairman-verify`, {
        checkerNotes: checkerNotes.trim(),
      }),
    onSuccess: () => {
      invalidate();
      setChairmanVerifyOpen(false);
      setCheckerNotes('');
      notify.success('Documents verified');
    },
    onError: (e: Error) => notify.error('Verify failed'),
  });

  const chairmanApproveMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequest>(`/payment-requests/${id}/chairman-approve`, {
        comments: chairmanApproveComments.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setChairmanApproveOpen(false);
      setChairmanApproveComments('');
      notify.success('Execution approved');
    },
    onError: (e: Error) => notify.error('Approve failed'),
  });

  const addDocMutation = useMutation({
    mutationFn: () =>
      api.post<PaymentRequestDocument[]>(`/payment-requests/${id}/documents`, {
        documentCode: addDocCode.trim().toUpperCase(),
        documentLabel: addDocLabel.trim() || undefined,
        fileName: addDocFileName,
        fileUrl: addDocFileUrl,
        mimeType: addDocMime || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payment-requests', id, 'documents'] });
      setAddDocCode('');
      setAddDocLabel('');
      setAddDocFileName('');
      setAddDocFileUrl('');
      setAddDocMime('');
      notify.success('Document added');
    },
    onError: (e: Error) => notify.error('Upload failed'),
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!pr) {
    return (
      <div className="py-20 text-center text-muted-foreground">Payment request not found.</div>
    );
  }

  const accountOpts = bankAccounts?.data ?? [];
  const chairmanAccountOpts = chairmanAccounts?.data ?? [];
  const isNonTerminal = [
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'AWAITING_PAYMENT_CONFIRMATION',
    'AWAITING_MAKER_PREP', 'AWAITING_CHECKER_REVIEW', 'AWAITING_HEAD_APPROVAL',
  ].includes(pr.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payment-requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{pr.requestNumber}</h1>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[pr.status]}`}
            >
              {STATUS_LABEL[pr.status] ?? pr.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Created {new Date(pr.createdAt).toLocaleString()}
            {pr.submittedAt && ` · Submitted ${new Date(pr.submittedAt).toLocaleString()}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* ── Standard (non-chairman) flow ─────────────────────────── */}
          {!pr.isChairmanPayment && (
            <>
              {pr.status === 'DRAFT' && (
                <Button
                  size="sm"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                >
                  <Send className="mr-1 h-4 w-4" />
                  {submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
                </Button>
              )}
              {pr.status === 'PENDING_APPROVAL' && (
                <>
                  <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                    onClick={() => setApproveOpen(true)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-700 border-red-300"
                    onClick={() => setRejectOpen(true)}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </>
              )}
              {pr.status === 'APPROVED' && (
                <Button size="sm" onClick={() => setReleaseOpen(true)}>
                  <Send className="mr-1 h-4 w-4" /> Release to Bank
                </Button>
              )}
            </>
          )}

          {/* ── §9 Chairman flow ─────────────────────────────────────── */}
          {pr.isChairmanPayment && (
            <>
              {pr.status === 'DRAFT' && (isChairmanRole || isSuperAdmin) && (
                <Button size="sm" onClick={() => setChairmanSubmitOpen(true)}>
                  <Send className="mr-1 h-4 w-4" /> Submit to Payments Team
                </Button>
              )}
              {pr.status === 'AWAITING_MAKER_PREP' && (hasMakerRole || isSuperAdmin) && (
                <Button size="sm" onClick={() => setChairmanPrepareOpen(true)}>
                  <Send className="mr-1 h-4 w-4" /> Prepare TT
                </Button>
              )}
              {pr.status === 'AWAITING_CHECKER_REVIEW' && (hasCheckerRole || isSuperAdmin) && (
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300"
                  onClick={() => setChairmanVerifyOpen(true)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Verify Documents
                </Button>
              )}
              {pr.status === 'AWAITING_HEAD_APPROVAL' && (hasHeadRole || isSuperAdmin) && (
                <Button size="sm" variant="outline" className="text-violet-700 border-violet-300"
                  onClick={() => setChairmanApproveOpen(true)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve Execution
                </Button>
              )}
            </>
          )}

          {/* Mark as Paid — shared by both flows */}
          {pr.status === 'AWAITING_PAYMENT_CONFIRMATION' && (
            <Button size="sm" onClick={() => setPaidOpen(true)}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Paid
            </Button>
          )}

          {isNonTerminal && (
            <>
              <Button size="sm" variant="outline" onClick={() => setWithdrawOpen(true)}>
                Withdraw
              </Button>
              <Button size="sm" variant="outline" className="text-red-700"
                onClick={() => setCancelOpen(true)}>
                Cancel (Admin)
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payment Details
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <Field label="Payment Type" value={pr.paymentTypeCode} />
          <Field label="Legal Entity" value={pr.legalEntity?.name ?? pr.legalEntityId} />
          {pr.counterparty && (
            <Field label="Counterparty" value={pr.counterparty.name} />
          )}
          {pr.employee && (
            <Field label="Employee" value={pr.employee.fullName} />
          )}
          {!pr.counterparty && !pr.employee && (
            <Field
              label="Beneficiary"
              value={pr.paymentTypeCode === 'CHAIRMAN' ? 'N/A (Chairman payment)' : '—'}
            />
          )}
          {pr.beneficiaryAccount && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Beneficiary Account
              </p>
              <p className="text-sm font-medium">{pr.beneficiaryAccount.accountHolderName}</p>
              <p className="text-xs text-muted-foreground">
                {pr.beneficiaryAccount.bankName ?? pr.beneficiaryAccount.bank?.name ?? '—'}
                {' · '}
                {pr.beneficiaryAccount.accountNumber}
                {pr.beneficiaryAccount.iban ? ` · IBAN: ${pr.beneficiaryAccount.iban}` : ''}
                {pr.beneficiaryAccount.swiftBic ? ` · SWIFT: ${pr.beneficiaryAccount.swiftBic}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {pr.beneficiaryAccount.currency?.code ?? pr.beneficiaryAccount.currencyId}
                {' · '}
                {pr.beneficiaryAccount.countryCode}
              </p>
            </div>
          )}

          {/* §9 — Chairman beneficiary (confidential; may be masked) */}
          {pr.isChairmanPayment && pr.chairmanBeneficiary && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Chairman Beneficiary
                {!canSeeConfidential && (
                  <span className="ml-1 text-xs font-normal italic text-muted-foreground">
                    (restricted)
                  </span>
                )}
              </p>
              {pr.chairmanBeneficiary.accountHolderName === 'Confidential' ? (
                <p className="text-sm italic text-muted-foreground">
                  <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                  Confidential — not visible to your role
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium">{pr.chairmanBeneficiary.accountHolderName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pr.chairmanBeneficiary.bankName ?? pr.chairmanBeneficiary.bank?.name ?? '—'}
                    {' · '}
                    {pr.chairmanBeneficiary.accountNumber}
                    {pr.chairmanBeneficiary.iban ? ` · IBAN: ${pr.chairmanBeneficiary.iban}` : ''}
                    {pr.chairmanBeneficiary.swiftBic ? ` · SWIFT: ${pr.chairmanBeneficiary.swiftBic}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pr.chairmanBeneficiary.currency?.code ?? pr.chairmanBeneficiary.currencyId}
                    {' · '}
                    {pr.chairmanBeneficiary.countryCode}
                  </p>
                </>
              )}
            </div>
          )}
          <Field label="Currency" value={pr.currencyCode} />
          <Field
            label="Amount"
            value={`${pr.currencyCode} ${Number(pr.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}`}
          />
          {pr.isCrossCurrency && (
            <Field
              label="Indicative Source Amount"
              value={
                pr.indicativeSourceAmount
                  ? `${pr.sourceAccount?.currency?.code ?? ''} ${pr.indicativeSourceAmount}`
                  : '—'
              }
            />
          )}
          <Field
            label="Source Account"
            value={
              pr.sourceAccount
                ? `${pr.sourceAccount.nickname} (${pr.sourceAccount.accountNumber})`
                : ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(pr.status)
                  ? 'Assigned at release step'
                  : '—'
            }
          />
          {pr.invoiceNumber && <Field label="Invoice Number" value={pr.invoiceNumber} />}
          {pr.dueDate && (
            <Field
              label="Due Date"
              value={new Date(pr.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            />
          )}
          {pr.bankReference && <Field label="Bank Reference" value={pr.bankReference} />}
          {pr.valueDate && <Field label="Value Date" value={pr.valueDate} />}
          {pr.approvedAt && (
            <Field label="Approved At" value={new Date(pr.approvedAt).toLocaleString()} />
          )}
          {pr.paidAt && (
            <Field label="Paid At" value={new Date(pr.paidAt).toLocaleString()} />
          )}
          {pr.proofOfPaymentUrl && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proof of Payment</p>
              <a
                href={resolveFileUrl(pr.proofOfPaymentUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                View document
              </a>
            </div>
          )}
          {pr.rejectionReason && (
            <div className="col-span-3">
              <Field label="Rejection Reason" value={pr.rejectionReason} />
            </div>
          )}
          {pr.cancellationReason && (
            <div className="col-span-3">
              <Field label="Cancellation / Withdrawal Reason" value={pr.cancellationReason} />
            </div>
          )}
          {pr.purposeDescription && (
            <div className="col-span-3">
              <Field label="Purpose" value={pr.purposeDescription} />
            </div>
          )}
          {pr.makerNotes && (
            <div className="col-span-3">
              <Field label="Maker Notes" value={pr.makerNotes} />
            </div>
          )}
        </div>
      </Card>

      {/* §4.2 — Frozen counterparty / beneficiary snapshot (shown once submitted) */}
      {pr.status !== 'DRAFT' && (pr.counterpartySnapshot ?? pr.beneficiarySnapshot) && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Submission Snapshot
            <span className="ml-2 text-xs font-normal text-muted-foreground normal-case">
              Data frozen at the time this request was submitted — immutable.
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {pr.counterpartySnapshot && (() => {
              const snap = pr.counterpartySnapshot as Record<string, unknown>;
              return (
                <>
                  {snap.name && <Field label="Counterparty (snapshot)" value={String(snap.name)} />}
                  {snap.fullName && <Field label="Employee (snapshot)" value={String(snap.fullName)} />}
                  {snap.employeeCode && <Field label="Employee Code" value={String(snap.employeeCode)} />}
                  {snap.role && <Field label="Role" value={String(snap.role)} />}
                  {snap.countryCode && <Field label="Country" value={String(snap.countryCode)} />}
                  {snap.payrollCategory && <Field label="Payroll Category" value={String(snap.payrollCategory)} />}
                  {snap.primaryContactEmail && <Field label="Contact Email" value={String(snap.primaryContactEmail)} />}
                  {snap.capturedAt && (
                    <Field
                      label="Captured At"
                      value={new Date(String(snap.capturedAt)).toLocaleString()}
                    />
                  )}
                </>
              );
            })()}
            {pr.beneficiarySnapshot && (() => {
              const snap = pr.beneficiarySnapshot as Record<string, unknown>;
              return (
                <>
                  {snap.accountHolderName && (
                    <Field label="Account Holder (snapshot)" value={String(snap.accountHolderName)} />
                  )}
                  {snap.accountNumber && (
                    <Field label="Account Number" value={String(snap.accountNumber)} />
                  )}
                  {snap.bankName && <Field label="Bank" value={String(snap.bankName)} />}
                  {snap.iban && <Field label="IBAN" value={String(snap.iban)} />}
                  {snap.swiftBic && <Field label="SWIFT / BIC" value={String(snap.swiftBic)} />}
                  {snap.countryCode && <Field label="Beneficiary Country" value={String(snap.countryCode)} />}
                  {snap.currencyCode && <Field label="Beneficiary Currency" value={String(snap.currencyCode)} />}
                  {snap.accountDirection && (
                    <Field label="Account Direction" value={String(snap.accountDirection)} />
                  )}
                </>
              );
            })()}
          </div>
        </Card>
      )}

      {/* §4.2 — Sanctions / anomaly warning (shown to approvers) */}
      {hasSanctionWarning && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm text-amber-800 dark:text-amber-400">
            <p className="font-semibold">Sanctions / Compliance Warning</p>
            {isCounterpartySanctioned && (
              <p>
                The counterparty&apos;s country (<strong>{pr.counterparty?.countryCode}</strong>)
                is on the sanctioned countries list. Review carefully before approving.
              </p>
            )}
            {isBeneSanctioned && (
              <p>
                The destination beneficiary account&apos;s country (
                <strong>{pr.beneficiaryAccount?.countryCode}</strong>) is on the sanctioned
                countries list. Approval constitutes explicit acknowledgement of this flag.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Approval Chain */}
      {approvals && approvals.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Approval Chain
            {pr.matrixVersion && (
              <span className="ml-2 text-xs font-normal">
                (Matrix v{pr.matrixVersion})
              </span>
            )}
          </h2>
          <ol className="space-y-3">
            {approvals.map((a) => {
              const approverLabel =
                a.approverType === 'USER'
                  ? `${a.approverUserName ?? a.approverUserEmail ?? 'Specific User'}`
                  : `${a.approverRoleName ?? 'Role'} (any holder)`;
              const decisionLabel =
                a.decision === 'APPROVED'
                  ? 'Approved'
                  : a.decision === 'REJECTED'
                    ? 'Rejected'
                    : 'Awaiting';
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="mt-0.5">{DECISION_ICON[a.decision]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Step {a.stepOrder}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {approverLabel}
                        {a.isOptional && ' · optional'}
                      </span>
                      <span
                        className={`ml-auto text-xs font-semibold ${
                          a.decision === 'APPROVED'
                            ? 'text-green-700'
                            : a.decision === 'REJECTED'
                              ? 'text-red-700'
                              : 'text-amber-600'
                        }`}
                      >
                        {decisionLabel}
                      </span>
                    </div>
                    {a.decidedAt && (
                      <p className="text-xs text-muted-foreground">
                        {decisionLabel} on {new Date(a.decidedAt).toLocaleString()}
                      </p>
                    )}
                    {a.comments && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        &quot;{a.comments}&quot;
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* Documents */}
      {documents && documents.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Supporting Documents
          </h2>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.documentLabel ?? doc.documentCode} ·{' '}
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
                {doc.fileUrl && (
                  <a
                    href={resolveFileUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-primary hover:underline"
                  >
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Add Document — only available while request is still DRAFT */}
      {pr.status === 'DRAFT' && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add Document
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Document Code <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. RECEIPTS"
                  value={addDocCode}
                  onChange={(e) => setAddDocCode(e.target.value)}
                  className="h-8 text-xs uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label (optional)</Label>
                <Input
                  placeholder="e.g. Supporting Receipts"
                  value={addDocLabel}
                  onChange={(e) => setAddDocLabel(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">File <span className="text-red-500">*</span></Label>
              {addDocFileUrl ? (
                <div className="flex h-8 items-center gap-2 rounded-md border bg-muted/50 px-3 text-xs">
                  <UploadCloud className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{addDocFileName}</span>
                  <button
                    type="button"
                    onClick={() => { setAddDocFileUrl(''); setAddDocFileName(''); setAddDocMime(''); }}
                    className="text-muted-foreground hover:text-foreground"
                  >×</button>
                </div>
              ) : (
                <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-dashed bg-background px-3 text-xs text-muted-foreground hover:bg-muted/50">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{addDocUploading ? 'Uploading…' : 'Click to attach file…'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAddDocUploading(true);
                      try {
                        const result = await api.upload(file);
                        setAddDocFileName(result.fileName);
                        setAddDocFileUrl(result.url);
                        setAddDocMime(file.type);
                      } catch {
                        notify.error('Upload failed');
                      } finally {
                        setAddDocUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => addDocMutation.mutate()}
              disabled={addDocMutation.isPending || !addDocCode.trim() || !addDocFileUrl}
            >
              <UploadCloud className="mr-1 h-3.5 w-3.5" />
              {addDocMutation.isPending ? 'Saving…' : 'Attach Document'}
            </Button>
          </div>
        </Card>
      )}

      {/* §4.2 — Counterparty recent payment history */}
      {counterpartyHistory && counterpartyHistory.data.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Counterparty Recent Payment History
            <span className="ml-2 text-xs font-normal">(last 5 paid requests to {pr.counterparty?.name})</span>
          </h2>
          <ul className="space-y-2">
            {counterpartyHistory.data.map((h) => (
              <li key={h.id} className="flex items-center gap-4 text-sm">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{h.requestNumber}</code>
                <span className="font-mono text-xs">
                  {h.currencyCode}{' '}
                  {Number(h.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
                {h.invoiceNumber && (
                  <span className="text-xs text-muted-foreground">Inv: {h.invoiceNumber}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Paid {h.paidAt ? new Date(h.paidAt).toLocaleDateString() : '—'}
                </span>
                <Link href={`/payment-requests/${h.id}`}>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">View</Button>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Action Dialogs                                                       */}
      {/* ------------------------------------------------------------------ */}

      {/* Approve */}
      <Dialog open={approveOpen} onOpenChange={(o) => {
        setApproveOpen(o);
        if (!o) { setApproveComment(''); setSanctionAcknowledgement(''); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Approve this request?</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* §6.5 — Sanction acknowledgement required when sanctionWarning = true */}
            {pr?.sanctionWarning && (
              <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 dark:bg-red-950/30">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="space-y-1 text-sm text-red-800 dark:text-red-400">
                  <p className="font-semibold">Sanctions Warning — Acknowledgement Required</p>
                  <p className="text-xs">
                    This payment involves a sanctioned country. You must provide a written acknowledgement
                    before your approval can be recorded. The acknowledgement will be stored against this
                    payment request for audit purposes (§6.5).
                  </p>
                </div>
              </div>
            )}
            {pr?.sanctionWarning && (
              <div className="space-y-1.5">
                <Label htmlFor="sanctionAck">
                  Sanction Acknowledgement <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="sanctionAck"
                  value={sanctionAcknowledgement}
                  onChange={(e) => setSanctionAcknowledgement(e.target.value)}
                  placeholder="State your written acknowledgement of the sanctions risk and the business justification for proceeding…"
                  rows={3}
                />
                {!sanctionAcknowledgement.trim() && (
                  <p className="text-xs text-red-500">Required — cannot approve without acknowledgement.</p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Comments (optional)</Label>
              <Textarea value={approveComment} onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Add a note…" rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={
                approveMutation.isPending ||
                (!!pr?.sanctionWarning && !sanctionAcknowledgement.trim())
              }
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {approveMutation.isPending ? 'Approving…' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject this request?</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State the reason for rejection…" rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectReason.trim()}>
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw this request?</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="Reason for withdrawal…" rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => withdrawMutation.mutate()} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel (Admin) */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel this request (Admin)?</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="State the admin cancellation reason…" rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !cancelReason.trim()}>
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release to Bank */}
      <Dialog open={releaseOpen} onOpenChange={(open) => {
        setReleaseOpen(open);
        if (!open) { setReleaseChecked(new Set()); setReleaseAccountId(''); setMakerNotes(''); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Release Payment to Bank</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Source Account *</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={releaseAccountId}
                onChange={(e) => setReleaseAccountId(e.target.value)}
              >
                <option value="">— select —</option>
                {accountOpts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nickname} — {a.currency?.code} — Bal: {Number(a.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Maker Notes</Label>
              <Textarea value={makerNotes} onChange={(e) => setMakerNotes(e.target.value)}
                placeholder="Optional notes for this release…" rows={2} />
            </div>
            {/* §3 Maker verification checklist */}
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                Maker Verification Checklist
              </p>
              <p className="mb-3 text-xs text-amber-700 dark:text-amber-500">
                You must confirm all items below before releasing this payment.
              </p>
              <ul className="space-y-2">
                {RELEASE_CHECKLIST.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={`release-check-${idx}`}
                      checked={releaseChecked.has(idx)}
                      onChange={() => {
                        setReleaseChecked((prev) => {
                          const next = new Set(prev);
                          if (next.has(idx)) next.delete(idx); else next.add(idx);
                          return next;
                        });
                      }}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-amber-400 accent-amber-600"
                    />
                    <label htmlFor={`release-check-${idx}`} className="cursor-pointer text-xs text-amber-800 dark:text-amber-400">
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => releaseMutation.mutate()}
              disabled={releaseMutation.isPending || !releaseAccountId || !allReleaseChecked}>
              <Send className="mr-1 h-4 w-4" />
              {releaseMutation.isPending ? 'Releasing…' : 'Release'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── §9 Chairman Submit ─────────────────────────────────────────────── */}
      <Dialog open={chairmanSubmitOpen} onOpenChange={setChairmanSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Submit Chairman Payment
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will send the request directly to the Payments Team for preparation.
            No approval matrix will be triggered.
          </p>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => chairmanSubmitMutation.mutate()}
              disabled={chairmanSubmitMutation.isPending}
            >
              <Send className="mr-1 h-4 w-4" />
              {chairmanSubmitMutation.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── §9 Chairman Prepare (Maker) ────────────────────────────────────── */}
      <Dialog open={chairmanPrepareOpen} onOpenChange={(o) => {
        setChairmanPrepareOpen(o);
        if (!o) { setChairmanSourceAccountId(''); setChairmanMakerNotes(''); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Prepare TT — Chairman Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Chairman-Designated Source Account *</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={chairmanSourceAccountId}
                onChange={(e) => setChairmanSourceAccountId(e.target.value)}
              >
                <option value="">— select —</option>
                {chairmanAccountOpts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nickname} — {a.currency?.code} — Bal: {Number(a.balance).toLocaleString()}
                  </option>
                ))}
              </select>
              {chairmanAccountOpts.length === 0 && (
                <p className="text-xs text-muted-foreground">No chairman-designated accounts available.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Maker Notes (optional)</Label>
              <Textarea
                value={chairmanMakerNotes}
                onChange={(e) => setChairmanMakerNotes(e.target.value)}
                placeholder="Notes for the checker…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => chairmanPrepareMutation.mutate()}
              disabled={chairmanPrepareMutation.isPending || !chairmanSourceAccountId}
            >
              <Send className="mr-1 h-4 w-4" />
              {chairmanPrepareMutation.isPending ? 'Preparing…' : 'Prepare TT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── §9 Chairman Verify (Checker) ───────────────────────────────────── */}
      <Dialog open={chairmanVerifyOpen} onOpenChange={(o) => {
        setChairmanVerifyOpen(o);
        if (!o) setCheckerNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Verify Documents — Chairman Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You cannot verify a payment you prepared (maker-checker separation).
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="checkerNotes">Checker Notes *</Label>
              <Textarea
                id="checkerNotes"
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                placeholder="Document verification notes…"
                rows={3}
              />
              {!checkerNotes.trim() && (
                <p className="text-xs text-red-500">Checker notes are required.</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => chairmanVerifyMutation.mutate()}
              disabled={chairmanVerifyMutation.isPending || !checkerNotes.trim()}
              className="border-blue-300 text-blue-700"
              variant="outline"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {chairmanVerifyMutation.isPending ? 'Verifying…' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── §9 Chairman Approve (Head) ─────────────────────────────────────── */}
      <Dialog open={chairmanApproveOpen} onOpenChange={(o) => {
        setChairmanApproveOpen(o);
        if (!o) setChairmanApproveComments('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Approve Execution — Chairman Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will move the request to Awaiting Payment Confirmation.
            </p>
            <div className="space-y-1.5">
              <Label>Comments (optional)</Label>
              <Textarea
                value={chairmanApproveComments}
                onChange={(e) => setChairmanApproveComments(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => chairmanApproveMutation.mutate()}
              disabled={chairmanApproveMutation.isPending}
              className="border-violet-300 text-violet-700"
              variant="outline"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {chairmanApproveMutation.isPending ? 'Approving…' : 'Approve Execution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid */}
      <Dialog open={paidOpen} onOpenChange={setPaidOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Paid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bank Reference *</Label>
              <Input value={bankRef} onChange={(e) => setBankRef(e.target.value)}
                placeholder="Bank transaction reference" />
            </div>
            <div className="space-y-1.5">
              <Label>Value Date *</Label>
              <Input type="date" value={valueDate}
                onChange={(e) => setValueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Proof of Payment
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (SWIFT MT103 / debit advice / bank screenshot — PDF or image)
                </span>
              </Label>
              {proofUrl ? (
                <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs">{proofFileName}</span>
                  <button
                    type="button"
                    onClick={() => { setProofUrl(''); setProofFileName(''); }}
                    className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed bg-background px-3 text-sm text-muted-foreground hover:bg-muted/50">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="text-xs">{proofUploading ? 'Uploading…' : 'Click to attach proof of payment…'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setProofUploading(true);
                      try {
                        const result = await api.upload(file);
                        setProofFileName(result.fileName);
                        setProofUrl(result.url);
                      } catch {
                        notify.error('Upload failed');
                      } finally {
                        setProofUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending || !bankRef.trim() || !valueDate}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {markPaidMutation.isPending ? 'Saving…' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
