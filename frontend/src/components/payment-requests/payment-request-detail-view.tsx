'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '@/lib/datetime';
import type { PresignFn } from '@/lib/api';
import type { PaymentRequest, PaymentRequestDocument } from '@/types/domain';
import { FileActions } from '@/components/shared/file-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Single source of truth for the payment-request detail UI. Both the admin
 * detail page ((protected)/payment-requests/[id]) and the employee self-service
 * portal render this, so the two are guaranteed identical.
 *
 * Interactive bits are injected via slots so this component stays display-only:
 *   - `actions`         — lifecycle buttons in the header (admin only)
 *   - `documentActions` — per-document trailing control, e.g. remove (admin)
 *   - `documentsFooter` — add-document UI (admin)
 * The employee portal passes none of these → a read-only view.
 */

export const STATUS_STYLES: Record<string, string> = {
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
  roleName: string | null;
};

/** Treasury Team timeline (maker → checker → authoriser) from the request's fields. */
export function treasurySteps(pr: PaymentRequest, isConfidential = false): TtStepView[] {
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
    // Request bounced back to the maker after a checker/authoriser rejection.
    if (s.role === 'MAKER' && active && pr.rejectionReason) detail = `Returned: ${pr.rejectionReason}`;
    const roleName =
      s.role === 'MAKER' ? pr.treasuryMakerRole?.name
      : s.role === 'CHECKER' ? pr.treasuryCheckerRole?.name
      : pr.treasuryAuthoriserRole?.name;
    return {
      order: s.order, role: s.role, label: s.label, badge, state,
      actor: s.user?.fullName ?? null, at: s.at ?? null, detail, roleName: roleName ?? null,
    };
  });
}

interface Props {
  pr: PaymentRequest;
  /** Where the back arrow links (e.g. /payment-requests or /employee). */
  backHref: string;
  /** Lifecycle action buttons rendered in the header (admin only). */
  actions?: React.ReactNode;
  /** Per-document trailing control, e.g. a remove button (admin only). */
  documentActions?: (doc: PaymentRequestDocument) => React.ReactNode;
  /** Add-document UI rendered at the foot of the Documents card (admin only). */
  documentsFooter?: React.ReactNode;
  /** Realm-specific presign for file view/download (defaults to staff realm). */
  presign?: PresignFn;
}

export function PaymentRequestDetailView({
  pr,
  backHref,
  actions,
  documentActions,
  documentsFooter,
  presign,
}: Props): React.ReactElement {
  const isConfidential = pr.paymentType?.isConfidential ?? false;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href={backHref}>
          <Button size="icon" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{pr.requestNumber}</h1>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[pr.status] ?? 'bg-muted text-muted-foreground ring-border'}`}>
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
        actions={actions}
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Request */}
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
                    <FileActions className="ml-auto" fileUrl={d.fileUrl} fileName={d.fileName} presign={presign} />
                    {documentActions?.(d)}
                  </li>
                ))}
              </ul>
            )}
            {documentsFooter}
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
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>SWIFT / MT103 copy</span>
                          <FileActions fileUrl={pr.swiftCopyUrl} fileName="swift-mt103" presign={presign} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
