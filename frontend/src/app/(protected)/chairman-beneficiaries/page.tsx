'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, Eye, Unlock } from 'lucide-react';
import Link from 'next/link';
import { api, friendlyError } from '@/lib/api';
import type { ChairmanBeneficiary, ChairmanBeneficiaryStatus, Paginated } from '@/types/domain';
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

const KEY = 'chairman-beneficiaries';

const STATUS_LABEL: Record<ChairmanBeneficiaryStatus, string> = {
  ACTIVE: 'Active',
  PENDING_ACTIVATION: 'Pending Activation',
  INACTIVE: 'Inactive',
};

const STATUS_STYLE: Record<ChairmanBeneficiaryStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PENDING_ACTIVATION: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  INACTIVE: 'bg-muted text-muted-foreground',
};

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChairmanBeneficiaryStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
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

// ─── detail dialog ────────────────────────────────────────────────────────────

interface DetailDialogProps {
  account: ChairmanBeneficiary;
  open: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
}

function DetailDialog({ account, open, onClose, onActionSuccess }: DetailDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverride, setShowOverride] = useState(false);

  function handleClose() {
    setOverrideReason('');
    setShowOverride(false);
    onClose();
  }

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/chairman-beneficiaries/${account.id}/activate`, {}),
    onSuccess: () => {
      toast({ title: 'Account activated', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Activation failed', description: friendlyError(err), variant: 'error' }),
  });

  const overrideMutation = useMutation({
    mutationFn: () =>
      api.post(`/chairman-beneficiaries/${account.id}/override-cooling-off`, {
        reason: overrideReason.trim(),
      }),
    onSuccess: () => {
      toast({ title: 'Cooling-off overridden', variant: 'success' });
      onActionSuccess();
      handleClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Override failed', description: friendlyError(err), variant: 'error' }),
  });

  const isCoolingOff =
    account.coolingOffUntil != null && new Date(account.coolingOffUntil) > new Date();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{account.accountHolderName}</span>
            <StatusBadge status={account.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Anomaly / sanction warnings */}
          {account.anomalyFlag && (
            <div className="flex gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Anomaly Detected</p>
                {account.anomalyNotes
                  ? account.anomalyNotes.split('\n').map((n, i) => <p key={i} className="text-xs">{n}</p>)
                  : <p className="text-xs">Anomaly signals were triggered on this account.</p>}
              </div>
            </div>
          )}

          {account.sanctionWarning && (
            <div className="flex gap-3 rounded-md border border-orange-400 bg-orange-50 p-3 text-orange-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <p className="text-sm font-semibold">Sanctioned Country Warning</p>
            </div>
          )}

          {/* Cooling-off banner */}
          {isCoolingOff && (
            <div className="flex gap-3 rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Cooling-Off Period Active</p>
                <p className="text-xs">
                  Until {new Date(account.coolingOffUntil!).toLocaleString()}.
                  The account will auto-activate after this period.
                </p>
              </div>
            </div>
          )}

          {/* Account details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Account Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Account Holder" value={account.accountHolderName} />
              <Field label="Account Number" value={account.accountNumber} />
              <Field label="Bank" value={account.bank?.name ?? account.bankName} />
              <Field label="Branch" value={account.branchName} />
              <Field label="SWIFT / BIC" value={account.swiftBic} />
              <Field label="IBAN" value={account.iban} />
              <Field label="Currency" value={account.currency?.code ?? account.currencyId} />
              <Field label="Country" value={account.countryCode} />
              <Field label="Status" value={<StatusBadge status={account.status} />} />
              <Field
                label="Cooling Off Until"
                value={account.coolingOffUntil ? new Date(account.coolingOffUntil).toLocaleString() : undefined}
              />
            </div>
          </section>

          {/* Activate action (PENDING_ACTIVATION and cooling-off expired) */}
          {account.status === 'PENDING_ACTIVATION' && !isCoolingOff && (
            <section className="rounded-md border p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Activate Account
              </h3>
              <p className="text-xs text-muted-foreground">
                The cooling-off period has elapsed. This account is ready for activation.
              </p>
              <Button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? 'Activating…' : 'Activate'}
              </Button>
            </section>
          )}

          {/* Override cooling-off (SYSTEM_ADMIN / SUPER_ADMIN only) */}
          {account.status === 'PENDING_ACTIVATION' && isCoolingOff && (
            <section className="rounded-md border p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Override Cooling-Off
              </h3>
              {!showOverride ? (
                <Button variant="outline" onClick={() => setShowOverride(true)}>
                  <Unlock className="mr-1.5 h-4 w-4" />
                  Override Cooling-Off Period
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="overrideReason">Override Reason *</Label>
                    <Textarea
                      id="overrideReason"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="State the reason for overriding the cooling-off period…"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => overrideMutation.mutate()}
                      disabled={overrideMutation.isPending || !overrideReason.trim()}
                    >
                      {overrideMutation.isPending ? 'Overriding…' : 'Confirm Override'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowOverride(false)}>
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

export default function ChairmanBeneficiariesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ChairmanBeneficiary | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [KEY, page],
    queryFn: () =>
      api.get<Paginated<ChairmanBeneficiary>>(`/chairman-beneficiaries?page=${page}&limit=20`),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: [KEY] });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/chairman-beneficiaries/change-requests">
          <Button variant="outline" size="sm">
            View Change Requests
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Chairman Beneficiaries"
        description="Confidential beneficiary accounts used exclusively for chairman payments."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Holder</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-12 text-center" title="Anomaly / Sanction">⚠</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((acct) => (
                <TableRow key={acct.id}>
                  <TableCell className="font-medium">{acct.accountHolderName}</TableCell>
                  <TableCell className="font-mono text-sm">{acct.accountNumber}</TableCell>
                  <TableCell className="text-sm">{acct.bank?.name ?? acct.bankName ?? '—'}</TableCell>
                  <TableCell className="text-sm">{acct.currency?.code ?? acct.currencyId}</TableCell>
                  <TableCell className="text-sm">{acct.countryCode}</TableCell>
                  <TableCell>
                    <StatusBadge status={acct.status} />
                    {acct.coolingOffUntil && new Date(acct.coolingOffUntil) > new Date() && (
                      <span className="ml-1.5 inline-flex items-center">
                        <Clock className="h-3.5 w-3.5 text-blue-500" title="Cooling-off active" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {(acct.anomalyFlag || acct.sanctionWarning) && (
                      <span title={acct.anomalyFlag ? 'Anomaly' : 'Sanctioned country'}>
                        <AlertTriangle className={`inline-block h-4 w-4 ${acct.anomalyFlag ? 'text-red-500' : 'text-orange-500'}`} />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelected(acct)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No chairman beneficiaries found.
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
          account={selected}
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
