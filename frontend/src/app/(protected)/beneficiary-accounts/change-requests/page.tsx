'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Eye, XCircle } from 'lucide-react';
import Link from 'next/link';
import { api, friendlyError, resolveFileUrl } from '@/lib/api';
import type {
  BeneficiaryAccountChangeRequest,
  ChangeRequestStatus,
  ChangeRequestType,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';

// ─── constants ────────────────────────────────────────────────────────────────

const KEY = 'beneficiary-account-change-requests';

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<ChangeRequestStatus, string> = {
  PENDING_VERIFICATION: 'bg-amber-500/10 text-amber-700',
  VERIFIED: 'bg-blue-500/10 text-blue-700',
  APPROVED: 'bg-green-500/10 text-green-700',
  REJECTED: 'bg-red-500/10 text-red-700',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const TYPE_LABEL: Record<ChangeRequestType, string> = {
  ADD: 'ADD',
  MODIFY: 'MODIFY',
  DEACTIVATE: 'DEACTIVATE',
};

const TYPE_STYLE: Record<ChangeRequestType, string> = {
  ADD: 'bg-green-500/10 text-green-700',
  MODIFY: 'bg-amber-500/10 text-amber-700',
  DEACTIVATE: 'bg-red-500/10 text-red-700',
};

const REQUIRED_DOC_CODES = ['CANCELLED_CHEQUE', 'BANK_LETTER', 'SOURCE_CORRESPONDENCE'] as const;

const REQUIRED_DOC_LABELS: Record<string, string> = {
  CANCELLED_CHEQUE: 'Cancelled Cheque',
  BANK_LETTER: 'Bank Letter',
  SOURCE_CORRESPONDENCE: 'Source Correspondence',
};

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChangeRequestStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: ChangeRequestType }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLE[type]}`}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  );
}

// ─── proposed data viewer ─────────────────────────────────────────────────────

function ProposedDataView({
  data,
}: {
  data: Record<string, unknown>;
}): React.ReactElement {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No proposed data.</p>;
  }
  return (
    <dl className="space-y-1.5">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-3 text-sm">
          <dt className="w-44 shrink-0 font-medium text-muted-foreground">{key}</dt>
          <dd className="flex-1 break-words">
            {val === null || val === undefined
              ? <span className="italic text-muted-foreground">—</span>
              : typeof val === 'object'
                ? <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{JSON.stringify(val)}</code>
                : String(val)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── detail dialog ────────────────────────────────────────────────────────────

interface DetailDialogProps {
  request: BeneficiaryAccountChangeRequest;
  open: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
}

function DetailDialog({
  request,
  open,
  onClose,
  onActionSuccess,
}: DetailDialogProps): React.ReactElement {
  const { toast } = useToast();

  const [verificationNotes, setVerificationNotes] = useState('');
  const [callbackEvidence, setCallbackEvidence] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [sanctionAck, setSanctionAck] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  function handleClose() {
    setVerificationNotes('');
    setCallbackEvidence('');
    setApproveNotes('');
    setSanctionAck('');
    setRejectReason('');
    setRejectOpen(false);
    onClose();
  }

  const verifyMutation = useMutation({
    mutationFn: () =>
      api.post(`/beneficiary-accounts/change-requests/${request.id}/verify`, {
        verificationNotes: verificationNotes.trim() || undefined,
        callbackEvidence: callbackEvidence.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Request verified', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Verify failed', description: friendlyError(err), variant: 'error' }),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      api.post(`/beneficiary-accounts/change-requests/${request.id}/approve`, {
        notes: approveNotes.trim() || undefined,
        sanctionAcknowledgement: sanctionAck.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Request approved', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Approve failed', description: friendlyError(err), variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      api.post(`/beneficiary-accounts/change-requests/${request.id}/reject`, {
        reason: rejectReason.trim(),
      }),
    onSuccess: () => {
      toast({ title: 'Request rejected', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Reject failed', description: friendlyError(err), variant: 'error' }),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post(`/beneficiary-accounts/change-requests/${request.id}/cancel`, {}),
    onSuccess: () => {
      toast({ title: 'Request cancelled', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Cancel failed', description: friendlyError(err), variant: 'error' }),
  });

  const needsCallback = request.changeType !== 'DEACTIVATE';
  const canVerify = !needsCallback || callbackEvidence.trim().length > 0;

  const presentDocCodes = new Set(request.documents?.map((d) => d.documentCode) ?? []);
  const missingDocs =
    needsCallback
      ? REQUIRED_DOC_CODES.filter((code) => !presentDocCodes.has(code))
      : [];

  const accountLabel =
    request.beneficiaryAccount
      ? `${request.beneficiaryAccount.accountHolderName} — ${request.beneficiaryAccount.accountNumber}`
      : request.changeType === 'ADD'
        ? 'New Account'
        : '—';

  const ownerName =
    request.beneficiaryAccount?.counterparty?.name ??
    request.beneficiaryAccount?.employee?.fullName ??
    '—';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeBadge type={request.changeType} />
            <span>Change Request Detail</span>
            <StatusBadge status={request.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* §6.4 — Anomaly alert */}
          {request.anomalyFlag && (
            <div className="flex gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Anomaly Detected</p>
                {request.anomalyNotes
                  ? request.anomalyNotes.split('\n').map((note, i) => (
                      <p key={i} className="text-xs">{note}</p>
                    ))
                  : <p className="text-xs">One or more anomaly signals were triggered on this request.</p>}
              </div>
            </div>
          )}

          {/* §6.5 — Sanctioned-country warning */}
          {request.sanctionWarning && (
            <div className="flex gap-3 rounded-md border border-orange-400 bg-orange-50 p-3 text-orange-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Sanctioned Country Warning</p>
                <p className="text-xs">
                  The proposed beneficiary country is on the sanctioned-country list.
                  Every reviewer must be aware of this risk. The final approver must
                  provide a written acknowledgement before approval can be registered.
                </p>
                {request.sanctionOverrideReason && (
                  <p className="text-xs mt-1">
                    <span className="font-medium">Approver acknowledgement:</span>{' '}
                    {request.sanctionOverrideReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Core details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Request Info
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="ID" value={<code className="text-xs font-mono">{request.id}</code>} />
              <Field label="Change Type" value={<TypeBadge type={request.changeType} />} />
              <Field label="Status" value={<StatusBadge status={request.status} />} />
              <Field
                label="Created At"
                value={new Date(request.createdAt).toLocaleString()}
              />
              <Field label="Account" value={accountLabel} />
              <Field label="Owner" value={ownerName} />
              <Field label="Requested By" value={request.requester?.fullName ?? request.requestedBy} />
              <Field label="Requester Email" value={request.requester?.email} />
            </div>
          </section>

          {/* Proposed data */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proposed Data
            </h3>
            <div className="rounded-md border bg-muted/30 p-3">
              <ProposedDataView data={request.proposedData} />
            </div>
          </section>

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documents
              </h3>
              <ul className="space-y-1.5">
                {request.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{doc.fileName}</span>
                    <span className="text-xs text-muted-foreground">{doc.documentCode}</span>
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
            </section>
          )}

          {/* Verification info (shown when verified or beyond) */}
          {(request.status === 'VERIFIED' ||
            request.status === 'APPROVED' ||
            request.status === 'REJECTED' ||
            request.status === 'CANCELLED') &&
            request.verifiedBy && (
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Verification
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field
                    label="Verified By"
                    value={request.verifier?.fullName ?? request.verifiedBy}
                  />
                  <Field
                    label="Verified At"
                    value={
                      request.verifiedAt
                        ? new Date(request.verifiedAt).toLocaleString()
                        : undefined
                    }
                  />
                  {request.verificationNotes && (
                    <div className="col-span-2">
                      <Field label="Verification Notes" value={request.verificationNotes} />
                    </div>
                  )}
                  {request.callbackEvidence && (
                    <div className="col-span-2">
                      <Field label="Callback Evidence" value={request.callbackEvidence} />
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Approval history (shown when approved or rejected) */}
          {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {request.status === 'APPROVED' ? 'Approval' : 'Rejection'}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {request.status === 'APPROVED' && (
                  <>
                    <Field label="Approved By" value={request.approvedBy} />
                    <Field
                      label="Approved At"
                      value={
                        request.approvedAt
                          ? new Date(request.approvedAt).toLocaleString()
                          : undefined
                      }
                    />
                  </>
                )}
                {request.status === 'REJECTED' && (
                  <>
                    <Field label="Rejected By" value={request.rejectedBy} />
                    <Field
                      label="Rejected At"
                      value={
                        request.rejectedAt
                          ? new Date(request.rejectedAt).toLocaleString()
                          : undefined
                      }
                    />
                    {request.rejectionReason && (
                      <div className="col-span-2">
                        <Field label="Rejection Reason" value={request.rejectionReason} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* PENDING_VERIFICATION: Verify form */}
          {request.status === 'PENDING_VERIFICATION' && (
            <section className="space-y-3 rounded-md border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verify this Request
              </h3>
              <p className="text-xs text-muted-foreground">
                You cannot verify a request you created.
              </p>

              {/* §6.2 — Required documents checklist for ADD / MODIFY */}
              {needsCallback && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Required Documents
                  </p>
                  {REQUIRED_DOC_CODES.map((code) => {
                    const present = presentDocCodes.has(code);
                    return (
                      <div key={code} className="flex items-center gap-2 text-xs">
                        {present
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                        <span className={present ? 'text-green-700' : 'text-red-600 font-medium'}>
                          {REQUIRED_DOC_LABELS[code]}
                        </span>
                        {!present && <span className="text-red-500 italic">(missing)</span>}
                      </div>
                    );
                  })}
                  {missingDocs.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      The server will reject verification until all required documents are uploaded.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="verNotes">Verification Notes</Label>
                  <Textarea
                    id="verNotes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes from account verification…"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="callbackEv">
                    Callback Evidence{needsCallback && <span className="ml-0.5 text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="callbackEv"
                    value={callbackEvidence}
                    onChange={(e) => setCallbackEvidence(e.target.value)}
                    placeholder="Reference or details of callback performed…"
                    rows={2}
                  />
                  {needsCallback && !callbackEvidence.trim() && (
                    <p className="text-xs text-red-500">Required for ADD / MODIFY requests.</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <Ban className="mr-1.5 h-4 w-4" />
                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Request'}
                </Button>
                <Button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending || !canVerify}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {verifyMutation.isPending ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
            </section>
          )}

          {/* VERIFIED: Approve + Reject */}
          {request.status === 'VERIFIED' && (
            <section className="space-y-3 rounded-md border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Approve or Reject
              </h3>

              {!rejectOpen ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="approveNotes">Notes (optional)</Label>
                    <Textarea
                      id="approveNotes"
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      placeholder="Add any approval notes…"
                      rows={2}
                    />
                  </div>

                  {/* §6.5 — sanction acknowledgement required when warning is set */}
                  {request.sanctionWarning && (
                    <div className="space-y-1.5">
                      <Label htmlFor="sanctionAck">
                        Sanction Acknowledgement <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="sanctionAck"
                        value={sanctionAck}
                        onChange={(e) => setSanctionAck(e.target.value)}
                        placeholder="Provide your written acknowledgement that this beneficiary is in a sanctioned country and approval is authorised…"
                        rows={3}
                        className={!sanctionAck.trim() ? 'border-orange-400 focus-visible:ring-orange-400' : ''}
                      />
                      {!sanctionAck.trim() && (
                        <p className="text-xs text-orange-700">
                          Required — approval cannot be registered without this acknowledgement.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending || (request.sanctionWarning && !sanctionAck.trim())}
                      className="border-green-300 text-green-700"
                      variant="outline"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      {approveMutation.isPending ? 'Approving…' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700"
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="ml-auto border-orange-300 text-orange-700"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      <Ban className="mr-1.5 h-4 w-4" />
                      {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Request'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rejectReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="State the reason for rejection…"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending || !rejectReason.trim()}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function BeneficiaryAccountChangeRequestsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BeneficiaryAccountChangeRequest | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [KEY, page],
    queryFn: () =>
      api.get<Paginated<BeneficiaryAccountChangeRequest>>(
        `/beneficiary-accounts/change-requests?page=${page}&limit=20`,
      ),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: [KEY] });
  }

  function getAccountLabel(req: BeneficiaryAccountChangeRequest): string {
    if (req.beneficiaryAccount) {
      return `${req.beneficiaryAccount.accountHolderName} — ${req.beneficiaryAccount.accountNumber}`;
    }
    if (req.changeType === 'ADD') return 'New Account';
    return '—';
  }

  function getOwnerName(req: BeneficiaryAccountChangeRequest): string {
    if (req.beneficiaryAccount?.counterparty) {
      return req.beneficiaryAccount.counterparty.name;
    }
    if (req.beneficiaryAccount?.employee) {
      return req.beneficiaryAccount.employee.fullName;
    }
    return '—';
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/beneficiary-accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Beneficiary Accounts
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Change Requests"
        description="Bank account change request workflow — verify and approve new or modified beneficiary accounts."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead className="w-32">Created At</TableHead>
              <TableHead>Verified By</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-12 text-center" title="Anomaly">⚠</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <TypeBadge type={req.changeType} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {getAccountLabel(req)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getOwnerName(req)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.requester?.fullName ?? req.requestedBy}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.verifier?.fullName ?? (req.verifiedBy ? req.verifiedBy : '—')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {req.anomalyFlag && (
                      <span title="Anomaly detected">
                        <AlertTriangle className="inline-block h-4 w-4 text-red-500" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelected(req)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  No change requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data && (
          <DataTablePagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      {selected && (
        <DetailDialog
          request={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onActionSuccess={() => {
            invalidate();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
