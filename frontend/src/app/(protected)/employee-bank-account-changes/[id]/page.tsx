'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { EbacChangeType, EbacStatus, EmployeeBankAccountChange } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';

const CHANGE_TYPE_LABEL: Record<EbacChangeType, string> = {
  ADD: 'Add',
  MODIFY: 'Modify',
  DEACTIVATE: 'Deactivate',
};

const STATUS_LABEL: Record<EbacStatus, string> = {
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<EbacStatus, string> = {
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

/** Convert camelCase / snake_case keys to Title Case for display. */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function FieldRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-4 py-2 border-b last:border-0">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-all">{value}</dd>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export default function EbacDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyCallback, setVerifyCallback] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const { data: change, isLoading } = useQuery({
    queryKey: ['ebac', id],
    queryFn: () => api.get<EmployeeBankAccountChange>(`/employee-bank-account-changes/${id}`),
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      api.post(`/employee-bank-account-changes/${id}/verify`, {
        verificationNotes: verifyNotes || undefined,
        callbackEvidence: verifyCallback || undefined,
      }),
    onSuccess: () => {
      notify.info('Request verified');
      setVerifyOpen(false);
      setVerifyError('');
      qc.invalidateQueries({ queryKey: ['ebac', id] });
    },
    onError: (e: Error) => setVerifyError(e.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/employee-bank-account-changes/${id}/approve`),
    onSuccess: () => {
      notify.info('Request approved', 'Employee record updated.');
      qc.invalidateQueries({ queryKey: ['ebac', id] });
    },
    onError: (e: Error) =>
      notify.error('Approve failed', e),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      api.post(`/employee-bank-account-changes/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      notify.info('Request rejected');
      setRejectOpen(false);
      setRejectError('');
      qc.invalidateQueries({ queryKey: ['ebac', id] });
    },
    onError: (e: Error) => setRejectError(e.message),
  });

  function openVerify() {
    setVerifyError('');
    setVerifyNotes('');
    setVerifyCallback('');
    setVerifyOpen(true);
  }

  function openReject() {
    setRejectError('');
    setRejectReason('');
    setRejectOpen(true);
  }

  if (isLoading || !change) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/employee-bank-account-changes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              {CHANGE_TYPE_LABEL[change.changeType]} Bank Account
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[change.status]}`}>
              {STATUS_LABEL[change.status]}
            </span>
            {change.anomalyFlag && (
              <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Anomaly
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {change.employee
              ? `${change.employee.employeeCode} — ${change.employee.fullName}`
              : change.employeeId}
          </p>
        </div>

        <div className="flex gap-2">
          {change.status === 'PENDING_VERIFICATION' && (
            <Button onClick={openVerify}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify
            </Button>
          )}
          {change.status === 'VERIFIED' && (
            <>
              <Button variant="destructive" onClick={openReject}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveMutation.isPending ? 'Approving…' : 'Approve'}
              </Button>
            </>
          )}
          {['PENDING_VERIFICATION', 'VERIFIED'].includes(change.status) && (
            <Button variant="outline" onClick={openReject}>
              Reject
            </Button>
          )}
        </div>
      </div>

      {/* Anomaly Warning */}
      {change.anomalyFlag && change.anomalyNotes && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 text-sm">Anomaly Flags</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap mt-1">{change.anomalyNotes}</pre>
            </div>
          </div>
        </Card>
      )}

      {/* Details */}
      <Card className="p-4">
        <h2 className="font-semibold text-sm mb-3">Request Details</h2>
        <dl>
          <FieldRow label="Change Type" value={CHANGE_TYPE_LABEL[change.changeType]} />
          <FieldRow label="Status" value={STATUS_LABEL[change.status]} />
          <FieldRow
            label="Requested By"
            value={
              change.requester
                ? `${change.requester.fullName} (${change.requester.email})`
                : change.requestedBy
            }
          />
          <FieldRow label="Created" value={new Date(change.createdAt).toLocaleString()} />
          {change.verifiedBy && (
            <FieldRow
              label="Verified By"
              value={
                change.verifier
                  ? `${change.verifier.fullName} (${change.verifier.email})`
                  : change.verifiedBy
              }
            />
          )}
          {change.verifiedAt && <FieldRow label="Verified At" value={new Date(change.verifiedAt).toLocaleString()} />}
          {change.verificationNotes && <FieldRow label="Verification Notes" value={change.verificationNotes} />}
          {change.callbackEvidence && <FieldRow label="Callback Evidence" value={change.callbackEvidence} />}
          {change.approvedBy && (
            <FieldRow
              label="Approved By"
              value={
                change.approver
                  ? `${change.approver.fullName} (${change.approver.email})`
                  : change.approvedBy
              }
            />
          )}
          {change.approvedAt && <FieldRow label="Approved At" value={new Date(change.approvedAt).toLocaleString()} />}
          {change.rejectedBy && (
            <FieldRow
              label="Rejected By"
              value={
                change.rejector
                  ? `${change.rejector.fullName} (${change.rejector.email})`
                  : change.rejectedBy
              }
            />
          )}
          {change.rejectionReason && <FieldRow label="Rejection Reason" value={change.rejectionReason} />}
        </dl>
      </Card>

      {/* Proposed Data */}
      {Object.keys(change.proposedData).length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3">Proposed Bank Account Data</h2>
          <dl>
            {Object.entries(change.proposedData).map(([key, val]) => (
              <FieldRow key={key} label={formatKey(key)} value={String(val)} />
            ))}
          </dl>
        </Card>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyOpen} onOpenChange={(open) => { setVerifyOpen(open); if (!open) setVerifyError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Change Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {verifyError && <InlineError message={verifyError} />}
            <div className="space-y-1">
              <Label>Verification Notes</Label>
              <Textarea
                rows={2}
                placeholder="Optional verification notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Callback Evidence</Label>
              <Textarea
                rows={2}
                placeholder="Optional callback evidence (e.g. call reference)"
                value={verifyCallback}
                onChange={(e) => setVerifyCallback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? 'Verifying…' : 'Confirm Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Change Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {rejectError && <InlineError message={rejectError} />}
            <Label>Reason *</Label>
            <Textarea
              rows={3}
              placeholder="Provide a rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
