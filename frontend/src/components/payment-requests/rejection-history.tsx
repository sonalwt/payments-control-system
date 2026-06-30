'use client';

import { useState } from 'react';
import { FileText, XCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/datetime';
import type { PaymentRequestRejection, PaymentRequestRejectionSnapshot } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileActions } from '@/components/shared/file-actions';

function stageLabelOf(r: PaymentRequestRejection): string {
  return r.stage === 'APPROVAL'
    ? (r.stepOrder ? `Approval · step ${r.stepOrder}` : 'Approval')
    : r.stage === 'TREASURY_MAKER' ? 'Treasury Maker'
    : r.stage === 'TREASURY_CHECKER' ? 'Treasury Checker'
    : r.stage === 'TREASURY_AUTHORISER' ? 'Treasury Authoriser'
    : r.stage;
}

/** Snapshot of the request's details at rejection time, shown inside the popup. */
function SnapshotDetails({ s }: { s: PaymentRequestRejectionSnapshot }): React.ReactElement {
  const rows: [string, string | undefined | null][] = [
    ['Payment type', s.paymentType ? `${s.paymentType.code} — ${s.paymentType.name}` : null],
    ['Legal entity', s.legalEntity ? `${s.legalEntity.code} — ${s.legalEntity.name}` : null],
    ['Amount', s.amount != null ? `${s.currencyCode ? `${s.currencyCode} ` : ''}${Number(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null],
    ['Counterparty', s.counterpartyName ?? s.employeeName],
    ['Beneficiary', s.beneficiary ? `${s.beneficiary.name} · ${s.beneficiary.accountNumber}` : null],
    ['Source account', s.sourceAccount ? `${s.sourceAccount.bank ?? ''} · ${s.sourceAccount.accountNumber}` : null],
    ['Invoice #', s.invoiceNumber],
    ['Due date', s.dueDate],
    ['Purpose', s.purposeDescription],
    ['Treasury ref.', s.treasuryReferenceNumber],
    ['Checker note', s.treasuryCheckerComments],
  ];
  const shown = rows.filter(([, v]) => v != null && v !== '');
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {shown.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>

      {(s.documents?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Documents</p>
          <ul className="divide-y rounded-md border">
            {s.documents!.map((d, i) => (
              <li key={i} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{d.documentCode}</code>
                <span className="truncate">{d.documentLabel ?? d.fileName}</span>
                <FileActions className="ml-auto" fileUrl={d.fileUrl} fileName={d.fileName} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {(s.approvals?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Approval chain</p>
          <ul className="space-y-1 text-xs">
            {s.approvals!.map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium">{a.stepOrder}</span>
                <span className="font-medium">{a.approver ?? '—'}</span>
                <span className={
                  a.decision === 'APPROVED' ? 'text-emerald-700'
                  : a.decision === 'REJECTED' ? 'text-rose-700'
                  : 'text-muted-foreground'
                }>{a.decision}</span>
                {a.decidedBy && <span className="text-muted-foreground">by {a.decidedBy}{a.decidedAt ? ` · ${formatDateTime(a.decidedAt)}` : ''}</span>}
                {a.comments && <span className="basis-full pl-6 whitespace-pre-wrap">“{a.comments}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Append-only rejection history for a payment request — preserved across
 * resubmissions and visible to anyone who can view the request. Rendered as a
 * compact button (placed in the page header) that opens a dialog listing every
 * rejection; each entry can drill into the snapshot of the request's details at
 * the moment it was rejected. Renders nothing when there's no history.
 */
export function RejectionHistory({
  rejections,
  className,
}: {
  rejections?: PaymentRequestRejection[] | null;
  className?: string;
}): React.ReactElement | null {
  const [listOpen, setListOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentRequestRejection | null>(null);

  if (!rejections || rejections.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`border-rose-200 text-rose-700 hover:bg-rose-50 ${className ?? ''}`}
        onClick={() => setListOpen(true)}
      >
        <XCircle className="mr-1 h-4 w-4 text-rose-600" />
        Rejection history ({rejections.length})
      </Button>

      <Dialog open={listOpen} onOpenChange={(o) => { if (!o) { setListOpen(false); setSelected(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Rejection #{selected.attemptNo} — {stageLabelOf(selected)}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Rejected by {selected.rejectedByUser?.fullName ?? '—'} · {formatDateTime(selected.rejectedAt)}
                </p>
              </DialogHeader>
              {selected.reason && (
                <div className="rounded-md bg-rose-50 p-2 text-xs text-rose-800 ring-1 ring-rose-200">
                  <strong>Reason:</strong> {selected.reason}
                </div>
              )}
              {selected.snapshot
                ? <SnapshotDetails s={selected.snapshot} />
                : <p className="text-sm text-muted-foreground">No snapshot was captured for this rejection.</p>}
              <div>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  ← Back to history
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader><DialogTitle>Rejection history</DialogTitle></DialogHeader>
              <ol className="space-y-2 text-sm">
                {rejections.map((r) => (
                  <li key={r.id} className="rounded-md bg-rose-50 px-3 py-2 ring-1 ring-rose-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span className="font-medium">Rejection #{r.attemptNo}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{stageLabelOf(r)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDateTime(r.rejectedAt)}</span>
                        {r.snapshot && (
                          <Button type="button" size="sm" variant="outline" onClick={() => setSelected(r)}>
                            View details
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.rejectedByUser?.fullName ?? '—'}
                    </div>
                    {r.reason && <div className="mt-1 text-xs whitespace-pre-wrap">{r.reason}</div>}
                  </li>
                ))}
              </ol>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
