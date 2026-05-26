'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Eye, Plus, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import type { LegalEntity, Paginated, PayrollBatch, PayrollBatchStatus } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
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

export default function PayrollBatchesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [open, setOpen] = useState(false);

  // Upload form state
  const [legalEntityId, setLegalEntityId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-batches', page, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      return api.get<Paginated<PayrollBatch>>(`/payroll-batches?${params}`);
    },
  });

  const { data: entities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?limit=100'),
  });

  const entityOptions = [
    { value: '', label: 'Select entity' },
    ...(entities?.data ?? []).map((e) => ({ value: e.id, label: e.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })),
  ];

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) =>
      api.postForm<PayrollBatch>('/payroll-batches/upload', fd),
    onSuccess: () => {
      toast({ title: 'Batch uploaded', description: 'Payroll batch created in Draft status.' });
      qc.invalidateQueries({ queryKey: ['payroll-batches'] });
      setOpen(false);
      setCsvFile(null);
      setPeriodLabel('');
      setCurrencyCode('');
      setLegalEntityId('');
    },
    onError: (e: Error) =>
      toast({ title: 'Upload failed', description: e.message, variant: 'error' }),
  });

  function handleUpload() {
    if (!csvFile || !legalEntityId || !periodLabel || !currencyCode) {
      toast({ title: 'Missing fields', description: 'Please fill all fields and select a CSV file.', variant: 'error' });
      return;
    }
    const fd = new FormData();
    fd.append('file', csvFile);
    fd.append('legalEntityId', legalEntityId);
    fd.append('periodLabel', periodLabel);
    fd.append('currencyCode', currencyCode.toUpperCase());
    uploadMutation.mutate(fd);
  }

  const batches = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Batches"
        description="Upload and manage payroll batches"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Payroll Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Legal Entity *</Label>
                  <Select
                    options={entityOptions}
                    value={legalEntityId}
                    onChange={(e) => setLegalEntityId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Period Label *</Label>
                  <Input
                    placeholder="e.g. May-2026"
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Currency Code *</Label>
                  <Input
                    placeholder="e.g. AED"
                    maxLength={3}
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CSV File *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {csvFile ? csvFile.name : 'Choose CSV'}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required columns: employee_code, gross_amount, net_amount, deductions
                    (optional: payslip_url)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Total Net</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No payroll batches found.
                </TableCell>
              </TableRow>
            )}
            {batches.map((b) => (
              <TableRow
                key={b.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/payroll-batches/${b.id}`)}
              >
                <TableCell className="font-mono font-medium">{b.batchNumber}</TableCell>
                <TableCell>{b.periodLabel}</TableCell>
                <TableCell>{b.legalEntity?.name ?? '—'}</TableCell>
                <TableCell className="text-right">{b.employeeCount}</TableCell>
                <TableCell className="text-right">
                  {fmtMinor(b.totalNetMinor, b.currencyCode)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </TableCell>
                <TableCell>
                  {b.varianceFlag && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Variance flag" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/payroll-batches/${b.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataTablePagination
          page={page}
          totalPages={Math.ceil(total / 20)}
          total={total}
          limit={20}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
