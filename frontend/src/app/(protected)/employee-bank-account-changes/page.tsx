'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Eye, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  EbacChangeType,
  EbacStatus,
  Employee,
  EmployeeBankAccountChange,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useNotify } from '@/hooks/use-notify';

const CHANGE_TYPE_LABEL: Record<EbacChangeType, string> = {
  ADD: 'Add',
  MODIFY: 'Modify',
  DEACTIVATE: 'Deactivate',
};

const CHANGE_TYPE_STYLE: Record<EbacChangeType, string> = {
  ADD: 'bg-green-100 text-green-800',
  MODIFY: 'bg-blue-100 text-blue-800',
  DEACTIVATE: 'bg-gray-100 text-gray-700',
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

export default function EmployeeBankAccountChangesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [open, setOpen] = useState(false);

  // Create form state
  const [employeeId, setEmployeeId] = useState('');
  const [changeType, setChangeType] = useState<EbacChangeType>('ADD');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankId, setBankId] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [iban, setIban] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ebac', page, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      return api.get<Paginated<EmployeeBankAccountChange>>(`/employee-bank-account-changes?${params}`);
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => api.get<Paginated<Employee>>('/employees?page=1&limit=200'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      api.post<EmployeeBankAccountChange>('/employee-bank-account-changes', payload),
    onSuccess: () => {
      notify.info('Change request created', 'The request is now pending verification.');
      qc.invalidateQueries({ queryKey: ['ebac'] });
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) =>
      notify.error('Create failed', e),
  });

  function resetForm() {
    setEmployeeId('');
    setChangeType('ADD');
    setAccountHolderName('');
    setAccountNumber('');
    setBankId('');
    setSwiftBic('');
    setIban('');
    setCurrencyCode('');
    setCountryCode('');
    setNotes('');
  }

  function handleCreate() {
    if (!employeeId) {
      notify.error('Missing fields', 'Please select an employee.');
      return;
    }
    const proposedData: Record<string, string> = {};
    if (accountHolderName) proposedData['accountHolderName'] = accountHolderName;
    if (accountNumber) proposedData['accountNumber'] = accountNumber;
    if (bankId) proposedData['bankId'] = bankId;
    if (swiftBic) proposedData['swiftBic'] = swiftBic;
    if (iban) proposedData['iban'] = iban;
    if (currencyCode) proposedData['currencyCode'] = currencyCode.toUpperCase();
    if (countryCode) proposedData['countryCode'] = countryCode.toUpperCase();
    if (notes) proposedData['notes'] = notes;

    createMutation.mutate({ employeeId, changeType, proposedData, documents: [] });
  }

  const changes = data?.data ?? [];
  const total = data?.total ?? 0;

  const employeeOptions = [
    { value: '', label: 'Select employee' },
    ...(employees?.data ?? []).map((e) => ({ value: e.id, label: `${e.employeeCode} — ${e.fullName}` })),
  ];

  const changeTypeOptions = [
    { value: 'ADD', label: 'Add' },
    { value: 'MODIFY', label: 'Modify' },
    { value: 'DEACTIVATE', label: 'Deactivate' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Bank Account Changes"
        description="Maker-checker workflow for employee bank account updates"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Change Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Bank Account Change Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Employee *</Label>
                  <Select
                    options={employeeOptions}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Change Type *</Label>
                  <Select
                    options={changeTypeOptions}
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as EbacChangeType)}
                  />
                </div>
                {changeType !== 'DEACTIVATE' && (
                  <>
                    <div className="space-y-1">
                      <Label>Account Holder Name</Label>
                      <Input value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Account Number</Label>
                      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Bank ID (UUID)</Label>
                      <Input placeholder="UUID of bank record" value={bankId} onChange={(e) => setBankId(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>SWIFT/BIC</Label>
                        <Input maxLength={11} value={swiftBic} onChange={(e) => setSwiftBic(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>IBAN</Label>
                        <Input maxLength={34} value={iban} onChange={(e) => setIban(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Currency Code</Label>
                        <Input maxLength={3} placeholder="AED" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Country Code</Label>
                        <Input maxLength={2} placeholder="AE" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="w-56">
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Change Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anomaly</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Verified By</TableHead>
              <TableHead>Created</TableHead>
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
            {!isLoading && changes.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No change requests found.
                </TableCell>
              </TableRow>
            )}
            {changes.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/employee-bank-account-changes/${c.id}`)}
              >
                <TableCell>
                  {c.employee
                    ? `${c.employee.employeeCode} — ${c.employee.fullName}`
                    : c.employeeId}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANGE_TYPE_STYLE[c.changeType]}`}>
                    {CHANGE_TYPE_LABEL[c.changeType]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </TableCell>
                <TableCell>
                  {c.anomalyFlag && (
                    <AlertTriangle className="h-4 w-4 text-red-500" aria-label="Anomaly flag" />
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.requestedBy}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.verifiedBy ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/employee-bank-account-changes/${c.id}`} onClick={(e) => e.stopPropagation()}>
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
