'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { PayrollBatch, PayrollBatchItem, PayrollBatchStatus } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

const STATUS_LABEL: Record<PayrollBatchStatus, string> = {
  VALIDATION_FAILED: 'Validation Failed',
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<PayrollBatchStatus, string> = {
  VALIDATION_FAILED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

function fmtMinor(minor: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
}

export default function PayrollBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const { data: batch, isLoading } = useQuery({
    queryKey: ['payroll-batch', id],
    queryFn: () => api.get<PayrollBatch & { items: PayrollBatchItem[] }>(`/payroll-batches/${id}`),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/payroll-batches/${id}/submit`),
    onSuccess: () => {
      toast({ title: 'Batch submitted', description: 'Payroll batch is now pending approval.' });
      qc.invalidateQueries({ queryKey: ['payroll-batch', id] });
    },
    onError: (e: Error) =>
      toast({ title: 'Submit failed', description: e.message, variant: 'error' }),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/payroll-batches/${id}/approve`),
    onSuccess: () => {
      toast({ title: 'Batch approved', description: 'Payment requests have been submitted.' });
      qc.invalidateQueries({ queryKey: ['payroll-batch', id] });
    },
    onError: (e: Error) =>
      toast({ title: 'Approve failed', description: e.message, variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/payroll-batches/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      toast({ title: 'Batch rejected' });
      setRejectOpen(false);
      setRejectError('');
      qc.invalidateQueries({ queryKey: ['payroll-batch', id] });
    },
    onError: (e: Error) => setRejectError(e.message),
  });

  if (isLoading || !batch) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const items = batch.items ?? [];

  type BreakdownRow = { count: number; grossMinor: number; netMinor: number; deductionsMinor: number };

  // Build country-level breakdown for the approval summary (§5.2c)
  const countryBreakdown = items.reduce<Record<string, BreakdownRow>>((acc, item) => {
    const cc = item.employee?.countryCode ?? 'XX';
    if (!acc[cc]) acc[cc] = { count: 0, grossMinor: 0, netMinor: 0, deductionsMinor: 0 };
    acc[cc].count += 1;
    acc[cc].grossMinor += item.grossAmountMinor;
    acc[cc].netMinor += item.netAmountMinor;
    acc[cc].deductionsMinor += item.deductionsMinor;
    return acc;
  }, {});
  const countryCodes = Object.keys(countryBreakdown).sort();

  // Build payroll-category breakdown as department-equivalent drill-down (§5.2d)
  const categoryBreakdown = items.reduce<Record<string, BreakdownRow>>((acc, item) => {
    const cat = item.employee?.payrollCategory ?? 'Unassigned';
    if (!acc[cat]) acc[cat] = { count: 0, grossMinor: 0, netMinor: 0, deductionsMinor: 0 };
    acc[cat].count += 1;
    acc[cat].grossMinor += item.grossAmountMinor;
    acc[cat].netMinor += item.netAmountMinor;
    acc[cat].deductionsMinor += item.deductionsMinor;
    return acc;
  }, {});
  const categories = Object.keys(categoryBreakdown).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/payroll-batches')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{batch.batchNumber}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[batch.status]}`}>
              {STATUS_LABEL[batch.status]}
            </span>
            {batch.varianceFlag && (
              <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Variance flag
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {batch.legalEntity?.name} · {batch.periodLabel} · {batch.currencyCode}
          </p>
        </div>
        <div className="flex gap-2">
          {batch.status === 'DRAFT' && (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              Submit for Approval
            </Button>
          )}
          {batch.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                variant="destructive"
                onClick={() => { setRejectError(''); setRejectReason(''); setRejectOpen(true); }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveMutation.isPending ? 'Approving…' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sanity Notes */}
      {batch.sanityNotes && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Sanity Warnings</p>
              <pre className="text-xs text-amber-700 whitespace-pre-wrap mt-1">{batch.sanityNotes}</pre>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: batch.employeeCount },
          { label: 'Total Gross', value: fmtMinor(batch.totalGrossMinor, batch.currencyCode) },
          { label: 'Total Net', value: fmtMinor(batch.totalNetMinor, batch.currencyCode) },
          {
            label: 'Headcount Delta',
            value: batch.headcountDelta != null
              ? (batch.headcountDelta > 0 ? `+${batch.headcountDelta}` : String(batch.headcountDelta))
              : '—',
          },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* Country Breakdown (§5.2c) */}
      {countryCodes.length > 0 && (
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold">By Country</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Total Gross</TableHead>
                <TableHead className="text-right">Total Deductions</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countryCodes.map((cc) => {
                const r = countryBreakdown[cc];
                return (
                  <TableRow key={cc}>
                    <TableCell className="font-medium">{cc}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.grossMinor, batch.currencyCode)}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.deductionsMinor, batch.currencyCode)}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.netMinor, batch.currencyCode)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Payroll Category Breakdown — department-equivalent drill-down (§5.2d) */}
      {categories.length > 0 && (
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold">By Payroll Category</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Total Gross</TableHead>
                <TableHead className="text-right">Total Deductions</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => {
                const r = categoryBreakdown[cat];
                return (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.grossMinor, batch.currencyCode)}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.deductionsMinor, batch.currencyCode)}</TableCell>
                    <TableCell className="text-right">{fmtMinor(r.netMinor, batch.currencyCode)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Items table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Batch Items ({items.length})</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead>Payslip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No items.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.employee?.employeeCode ?? item.employeeId}</TableCell>
                <TableCell>{item.employee?.fullName ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {fmtMinor(item.grossAmountMinor, batch.currencyCode)}
                </TableCell>
                <TableCell className="text-right">
                  {fmtMinor(item.deductionsMinor, batch.currencyCode)}
                </TableCell>
                <TableCell className="text-right">
                  {fmtMinor(item.netAmountMinor, batch.currencyCode)}
                </TableCell>
                <TableCell className="text-right">
                  {item.variancePct != null
                    ? `${item.variancePct > 0 ? '+' : ''}${item.variancePct.toFixed(1)}%`
                    : '—'}
                </TableCell>
                <TableCell>
                  {item.varianceFlag && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </TableCell>
                <TableCell>
                  {item.payslipUrl ? (
                    <a
                      href={item.payslipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payroll Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {rejectError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{rejectError}</span>
              </div>
            )}
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
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
