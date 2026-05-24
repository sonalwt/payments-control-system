'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Paperclip,
  Pencil,
  Plus,
  Shield,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  Bank,
  BeneficiaryAccount,
  BeneficiaryAccountStatus,
  Counterparty,
  Currency,
  Employee,
  Paginated,
  SanctionedCountry,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/components/ui/toast';

// ─── constants ────────────────────────────────────────────────────────────────

const KEY = 'beneficiary-accounts';

const STATUS_LABEL: Record<BeneficiaryAccountStatus, string> = {
  ACTIVE: 'Active',
  PENDING_ACTIVATION: 'Pending Activation',
  INACTIVE: 'Inactive',
};

const STATUS_STYLE: Record<BeneficiaryAccountStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PENDING_ACTIVATION: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  INACTIVE: 'bg-muted text-muted-foreground',
};

// ─── types ────────────────────────────────────────────────────────────────────

interface DocumentDraft {
  documentCode: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

type AccountDirection = 'PAY_TO' | 'RECEIVE_FROM' | 'BOTH';

interface ProposedData {
  counterpartyId?: string;
  employeeId?: string;
  accountHolderName: string;
  accountNumber: string;
  bankId: string;
  bankName?: string;
  branchName?: string;
  swiftBic?: string;
  iban?: string;
  currencyId: string;
  countryCode: string;
  accountDirection: AccountDirection;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BeneficiaryAccountStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function SanctionIcon({ countryCode, sanctionedCodes }: { countryCode: string; sanctionedCodes: Set<string> }): React.ReactElement | null {
  if (!sanctionedCodes.has(countryCode.toUpperCase())) return null;
  return (
    <span title={`${countryCode} is a sanctioned country`}>
      <Shield className="ml-1 inline-block h-3.5 w-3.5 text-red-600" />
    </span>
  );
}

// ─── file upload field ────────────────────────────────────────────────────────

interface FileUploadFieldProps {
  label: string;
  documentCode: string;
  doc: DocumentDraft;
  onChange: (updated: DocumentDraft) => void;
}

function FileUploadField({ label, documentCode, doc, onChange }: FileUploadFieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload(file);
      onChange({
        documentCode,
        fileName: result.fileName,
        fileUrl: result.url,
        mimeType: file.type,
      });
    } catch {
      toast({ title: 'Upload failed', variant: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function clearFile() {
    onChange({ documentCode, fileName: '', fileUrl: '', mimeType: '' });
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {doc.fileName ? (
        <div className="flex h-8 items-center gap-1.5 rounded-md border bg-muted/50 px-2 text-xs">
          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-foreground">{doc.fileName}</span>
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2 text-xs text-muted-foreground hover:border-primary hover:text-primary">
          <Paperclip className="h-3 w-3 shrink-0" />
          <span>{uploading ? 'Uploading…' : 'Choose PDF or Word file…'}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => { void handleFileChange(e); }}
          />
        </label>
      )}
    </div>
  );
}

// ─── account form (shared by Add and Modify dialogs) ─────────────────────────

interface AccountFormProps {
  initialData?: Partial<ProposedData>;
  counterparties: Counterparty[];
  employees: Employee[];
  banks: Bank[];
  currencies: Currency[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (proposedData: ProposedData, documents: DocumentDraft[]) => void;
  onCancel: () => void;
}

function AccountForm({
  initialData,
  counterparties,
  employees,
  banks,
  currencies,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: AccountFormProps): React.ReactElement {
  const [ownerType, setOwnerType] = useState<'counterparty' | 'employee'>(
    initialData?.employeeId ? 'employee' : 'counterparty',
  );
  const [counterpartyId, setCounterpartyId] = useState(initialData?.counterpartyId ?? '');
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId ?? '');
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName ?? '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber ?? '');
  const [bankId, setBankId] = useState(initialData?.bankId ?? '');
  const [bankName, setBankName] = useState(initialData?.bankName ?? '');
  const [branchName, setBranchName] = useState(initialData?.branchName ?? '');
  const [swiftBic, setSwiftBic] = useState(initialData?.swiftBic ?? '');
  const [iban, setIban] = useState(initialData?.iban ?? '');
  const [currencyId, setCurrencyId] = useState(initialData?.currencyId ?? '');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode ?? '');
  const [accountDirection, setAccountDirection] = useState<AccountDirection>(
    (initialData?.accountDirection as AccountDirection) ?? 'PAY_TO',
  );

  const [cancelledCheque, setCancelledCheque] = useState<DocumentDraft>({
    documentCode: 'CANCELLED_CHEQUE',
    fileName: '',
    fileUrl: '',
    mimeType: '',
  });
  const [bankLetter, setBankLetter] = useState<DocumentDraft>({
    documentCode: 'BANK_LETTER',
    fileName: '',
    fileUrl: '',
    mimeType: '',
  });
  const [sourceCorrespondence, setSourceCorrespondence] = useState<DocumentDraft>({
    documentCode: 'SOURCE_CORRESPONDENCE',
    fileName: '',
    fileUrl: '',
    mimeType: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const proposedData: ProposedData = {
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      bankId,
      bankName: bankName.trim() || undefined,
      branchName: branchName.trim() || undefined,
      swiftBic: swiftBic.trim() || undefined,
      iban: iban.trim() || undefined,
      currencyId,
      countryCode: countryCode.trim().toUpperCase(),
      accountDirection,
    };
    if (ownerType === 'counterparty') {
      proposedData.counterpartyId = counterpartyId || undefined;
    } else {
      proposedData.employeeId = employeeId || undefined;
    }

    const docs = [cancelledCheque, bankLetter, sourceCorrespondence].filter(
      (d) => d.fileName,
    );
    onSubmit(proposedData, docs);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Owner type radio */}
      <div className="space-y-1.5">
        <Label>Owner Type *</Label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="ownerType"
              value="counterparty"
              checked={ownerType === 'counterparty'}
              onChange={() => setOwnerType('counterparty')}
            />
            Counterparty
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="ownerType"
              value="employee"
              checked={ownerType === 'employee'}
              onChange={() => setOwnerType('employee')}
            />
            Employee
          </label>
        </div>
      </div>

      {/* Owner selector */}
      {ownerType === 'counterparty' ? (
        <div className="space-y-1.5">
          <Label htmlFor="baCpId">Counterparty *</Label>
          <select
            id="baCpId"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={counterpartyId}
            onChange={(e) => setCounterpartyId(e.target.value)}
            required
          >
            <option value="">— select counterparty —</option>
            {counterparties
              .filter((c) => c.isActive)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="baEmpId">Employee *</Label>
          <select
            id="baEmpId"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            <option value="">— select employee —</option>
            {employees
              .filter((e) => e.isActive)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode})
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Account Holder Name */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="baHolderName">Account Holder Name *</Label>
          <Input
            id="baHolderName"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            required
            placeholder="As it appears on the bank account"
          />
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <Label htmlFor="baAcctNum">Account Number *</Label>
          <Input
            id="baAcctNum"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            placeholder="e.g. 0123456789"
          />
        </div>

        {/* Bank */}
        <div className="space-y-1.5">
          <Label htmlFor="baBankId">Bank *</Label>
          <select
            id="baBankId"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            required
          >
            <option value="">— select bank —</option>
            {banks
              .filter((b) => b.isActive)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.countryCode})
                </option>
              ))}
          </select>
        </div>

        {/* Bank Name (optional override) */}
        <div className="space-y-1.5">
          <Label htmlFor="baBankName">Bank Name Override</Label>
          <Input
            id="baBankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Optional — overrides bank master name"
          />
        </div>

        {/* Branch Name */}
        <div className="space-y-1.5">
          <Label htmlFor="baBranchName">Branch Name</Label>
          <Input
            id="baBranchName"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {/* SWIFT/BIC */}
        <div className="space-y-1.5">
          <Label htmlFor="baSwift">SWIFT / BIC</Label>
          <Input
            id="baSwift"
            value={swiftBic}
            onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
            maxLength={11}
            placeholder="e.g. DBSSSGSG"
          />
        </div>

        {/* IBAN */}
        <div className="space-y-1.5">
          <Label htmlFor="baIban">IBAN</Label>
          <Input
            id="baIban"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            maxLength={34}
            placeholder="e.g. GB29NWBK60161331926819"
          />
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <Label htmlFor="baCurrencyId">Currency *</Label>
          <select
            id="baCurrencyId"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            required
          >
            <option value="">— select currency —</option>
            {currencies
              .filter((c) => c.isActive)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
          </select>
        </div>

        {/* Country Code */}
        <div className="space-y-1.5">
          <Label htmlFor="baCountry">Country Code * (ISO 2-char)</Label>
          <Input
            id="baCountry"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            maxLength={2}
            required
            placeholder="e.g. SG"
            className="uppercase"
          />
        </div>

        {/* Account Direction */}
        <div className="space-y-1.5">
          <Label htmlFor="baDirection">Account Direction *</Label>
          <select
            id="baDirection"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={accountDirection}
            onChange={(e) => setAccountDirection(e.target.value as AccountDirection)}
            required
          >
            <option value="PAY_TO">Pay-To (Outgoing payments to this account)</option>
            <option value="RECEIVE_FROM">Receive-From (Incoming receipts from this account)</option>
            <option value="BOTH">Both (Outgoing and incoming)</option>
          </select>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Supporting Documents</Label>
        <div className="space-y-2 rounded-md border p-3">
          <FileUploadField
            label="Cancelled Cheque"
            documentCode="CANCELLED_CHEQUE"
            doc={cancelledCheque}
            onChange={setCancelledCheque}
          />
          <FileUploadField
            label="Bank Letter"
            documentCode="BANK_LETTER"
            doc={bankLetter}
            onChange={setBankLetter}
          />
          <FileUploadField
            label="Source Correspondence"
            documentCode="SOURCE_CORRESPONDENCE"
            doc={sourceCorrespondence}
            onChange={setSourceCorrespondence}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function BeneficiaryAccountsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BeneficiaryAccountStatus | ''>('');
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<'counterparty' | 'employee' | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [modifying, setModifying] = useState<BeneficiaryAccount | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) u.set('status', statusFilter);
    if (ownerTypeFilter === 'counterparty') u.set('hasCounterparty', 'true');
    if (ownerTypeFilter === 'employee') u.set('hasEmployee', 'true');
    return u.toString();
  }, [page, statusFilter, ownerTypeFilter]);

  // Main data
  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<BeneficiaryAccount>>(`/beneficiary-accounts?${params}`),
  });

  // Reference data
  const { data: counterpartiesData } = useQuery({
    queryKey: ['counterparties', 'all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=100'),
  });
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => api.get<Paginated<Employee>>('/employees?page=1&limit=100'),
  });
  const { data: banksData } = useQuery({
    queryKey: ['banks', 'all'],
    queryFn: () => api.get<Paginated<Bank>>('/banks?page=1&limit=100'),
  });
  const { data: currenciesData } = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=100'),
  });
  const { data: sanctionedData } = useQuery({
    queryKey: ['sanctioned-countries', 'all'],
    queryFn: () =>
      api.get<Paginated<SanctionedCountry>>('/sanctioned-countries?page=1&limit=100'),
  });

  const sanctionedCodes = useMemo<Set<string>>(
    () =>
      new Set(
        (sanctionedData?.data ?? [])
          .filter((s) => s.isActive)
          .map((s) => s.countryCode.toUpperCase()),
      ),
    [sanctionedData],
  );

  const counterparties = counterpartiesData?.data ?? [];
  const employees = employeesData?.data ?? [];
  const banks = banksData?.data ?? [];
  const currencies = currenciesData?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({
      proposedData,
      documents,
    }: {
      proposedData: ProposedData;
      documents: DocumentDraft[];
    }) =>
      api.post('/beneficiary-accounts/change-requests', {
        changeType: 'ADD',
        proposedData,
        documents,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      toast({ title: 'Change request submitted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Submit failed', description: err.message, variant: 'error' }),
  });

  const modifyMutation = useMutation({
    mutationFn: ({
      proposedData,
      documents,
    }: {
      proposedData: ProposedData;
      documents: DocumentDraft[];
    }) =>
      api.post('/beneficiary-accounts/change-requests', {
        changeType: 'MODIFY',
        beneficiaryAccountId: modifying?.id,
        proposedData,
        documents,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setModifying(null);
      toast({ title: 'Modify change request submitted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Submit failed', description: err.message, variant: 'error' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      api.post('/beneficiary-accounts/change-requests', {
        changeType: 'DEACTIVATE',
        beneficiaryAccountId: id,
        proposedData: {},
        documents: [],
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: 'Deactivate change request submitted', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Submit failed', description: err.message, variant: 'error' }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/beneficiary-accounts/${id}/activate`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: 'Account activated', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({ title: 'Activate failed', description: err.message, variant: 'error' }),
  });

  function canActivate(account: BeneficiaryAccount): boolean {
    if (account.status !== 'PENDING_ACTIVATION') return false;
    if (!account.coolingOffUntil) return true;
    return new Date(account.coolingOffUntil) < new Date();
  }

  function getOwnerName(account: BeneficiaryAccount): string {
    if (account.counterparty) return account.counterparty.name;
    if (account.employee) return account.employee.fullName;
    return '—';
  }

  function buildModifyInitial(account: BeneficiaryAccount): Partial<ProposedData> {
    return {
      counterpartyId: account.counterpartyId ?? undefined,
      employeeId: account.employeeId ?? undefined,
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      bankId: account.bankId,
      bankName: account.bankName ?? undefined,
      branchName: account.branchName ?? undefined,
      swiftBic: account.swiftBic ?? undefined,
      iban: account.iban ?? undefined,
      currencyId: account.currencyId,
      countryCode: account.countryCode,
    };
  }

  return (
    <div>
      <PageHeader
        title="Beneficiary Accounts"
        description="Manage beneficiary bank accounts for counterparties and employees. All changes are processed via change requests and subject to verification."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Beneficiary Account — ADD Change Request</DialogTitle>
              </DialogHeader>
              <AccountForm
                counterparties={counterparties}
                employees={employees}
                banks={banks}
                currencies={currencies}
                submitting={createMutation.isPending}
                submitLabel="Submit ADD Request"
                onSubmit={(proposedData, documents) =>
                  createMutation.mutate({ proposedData, documents })
                }
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as BeneficiaryAccountStatus | '');
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_ACTIVATION">Pending Activation</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={ownerTypeFilter}
            onChange={(e) => {
              setPage(1);
              setOwnerTypeFilter(e.target.value as 'counterparty' | 'employee' | '');
            }}
          >
            <option value="">All owners</option>
            <option value="counterparty">Counterparty</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Account Holder</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead className="w-20">Currency</TableHead>
              <TableHead className="w-20">Country</TableHead>
              <TableHead className="w-28">Direction</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-36">Cooling-off Until</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="text-sm">
                    <div className="font-medium">{getOwnerName(account)}</div>
                    <div className="text-xs text-muted-foreground">
                      {account.counterpartyId ? 'Counterparty' : 'Employee'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{account.accountHolderName}</TableCell>
                  <TableCell className="text-sm">
                    <div>{account.bank?.name ?? account.bankName ?? '—'}</div>
                    {account.branchName && (
                      <div className="text-xs text-muted-foreground">{account.branchName}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {account.accountNumber}
                    </code>
                    {account.iban && (
                      <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                        {account.iban}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      {account.currency?.code ?? '—'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{account.countryCode}</span>
                    <SanctionIcon
                      countryCode={account.countryCode}
                      sanctionedCodes={sanctionedCodes}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      account.accountDirection === 'PAY_TO'
                        ? 'bg-blue-50 text-blue-700'
                        : account.accountDirection === 'RECEIVE_FROM'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-purple-50 text-purple-700'
                    }`}>
                      {account.accountDirection === 'PAY_TO' ? 'Pay-To' : account.accountDirection === 'RECEIVE_FROM' ? 'Receive-From' : 'Both'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={account.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {account.coolingOffUntil ? (
                      <span
                        className={
                          new Date(account.coolingOffUntil) > new Date()
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }
                      >
                        <Clock className="mr-1 inline-block h-3 w-3" />
                        {new Date(account.coolingOffUntil).toLocaleDateString()}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canActivate(account) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          title="Activate account"
                          disabled={activateMutation.isPending}
                          onClick={() => activateMutation.mutate(account.id)}
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          Activate
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Modify"
                        onClick={() => setModifying(account)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {account.status === 'ACTIVE' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Deactivate"
                          disabled={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(account.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                  No beneficiary accounts found.
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

      {/* Modify dialog */}
      <Dialog open={!!modifying} onOpenChange={(o) => !o && setModifying(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modify Beneficiary Account — MODIFY Change Request</DialogTitle>
          </DialogHeader>
          {modifying && (
            <AccountForm
              initialData={buildModifyInitial(modifying)}
              counterparties={counterparties}
              employees={employees}
              banks={banks}
              currencies={currencies}
              submitting={modifyMutation.isPending}
              submitLabel="Submit MODIFY Request"
              onSubmit={(proposedData, documents) =>
                modifyMutation.mutate({ proposedData, documents })
              }
              onCancel={() => setModifying(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
