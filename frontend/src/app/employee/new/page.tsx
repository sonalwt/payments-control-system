'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EmployeeShell } from '@/components/employee/employee-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useNotify } from '@/hooks/use-notify';
import {
  employeeApi,
  type EmployeePaymentType,
  type EmployeeBeneficiaryAccount,
  type EmployeeDocumentInput,
  type Paginated,
} from '@/lib/employee-api';

export default function NewReimbursementPage(): React.ReactElement {
  return (
    <EmployeeShell>
      <NewReimbursementForm />
    </EmployeeShell>
  );
}

function NewReimbursementForm(): React.ReactElement {
  const router = useRouter();
  const notify = useNotify();

  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [beneficiaryAccountId, setBeneficiaryAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [documents, setDocuments] = useState<EmployeeDocumentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url, fileName } = await employeeApi.upload(file);
        setDocuments((prev) => [
          ...prev,
          {
            documentCode: 'RECEIPT',
            documentLabel: fileName,
            fileName,
            fileUrl: url,
            fileSizeBytes: file.size,
            mimeType: file.type || undefined,
          },
        ]);
      }
    } catch (err) {
      notify.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  const { data: types } = useQuery({
    queryKey: ['employee', 'payment-types'],
    queryFn: () => employeeApi.get<EmployeePaymentType[]>('/employee/payment-types'),
  });

  const { data: accounts } = useQuery({
    queryKey: ['employee', 'beneficiary-accounts'],
    queryFn: () =>
      employeeApi.get<Paginated<EmployeeBeneficiaryAccount>>('/employee/beneficiary-accounts'),
  });

  const accountList = accounts?.data ?? [];
  const selectedAccount = accountList.find((a) => a.id === beneficiaryAccountId);

  const create = useMutation({
    mutationFn: () => {
      if (!selectedAccount) throw new Error('Select an account to be reimbursed to.');
      return employeeApi.post('/employee/payment-requests', {
        paymentTypeId,
        currencyId: selectedAccount.currencyId,
        beneficiaryAccountId,
        amount: Number(amount).toFixed(4),
        purposeDescription: purpose || undefined,
        documents: documents.length ? documents : undefined,
      });
    },
    onSuccess: () => {
      notify.success('Reimbursement saved as draft', 'Submit it from your list to start approval.');
      router.push('/employee');
    },
    onError: (err) => notify.error('Could not create request', err),
  });

  const valid =
    paymentTypeId && beneficiaryAccountId && Number(amount) > 0;

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">New reimbursement request</h1>

      <form
        className="space-y-4 rounded-md border bg-background p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="type">Payment type</Label>
          <Select
            id="type"
            placeholder="Select a type"
            value={paymentTypeId}
            onChange={(e) => setPaymentTypeId(e.target.value)}
            options={(types ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account">Reimburse to account</Label>
          <Select
            id="account"
            placeholder={accountList.length ? 'Select an account' : 'No accounts on file'}
            value={beneficiaryAccountId}
            onChange={(e) => setBeneficiaryAccountId(e.target.value)}
            options={accountList.map((a) => ({
              value: a.id,
              label: `${a.bank?.name ?? 'Bank'} • ${a.accountNumber} (${a.currency?.code ?? ''})`,
            }))}
          />
          {accountList.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No payable account is on file for you yet. Contact Finance/HR to add one.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount {selectedAccount?.currency?.code ? `(${selectedAccount.currency.code})` : ''}
          </Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">What is this for?</Label>
          <Textarea
            id="purpose"
            rows={3}
            placeholder="e.g. Client dinner, taxi fares, conference ticket…"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Receipts / supporting documents</Label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = ''; // allow re-selecting the same file
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Attach file'}
          </Button>
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground">PDF, JPG or PNG, up to 10 MB each.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {documents.map((d, i) => (
                <li
                  key={`${d.fileUrl}-${i}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="truncate">{d.fileName}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted-foreground underline hover:text-destructive"
                    onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.push('/employee')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid || uploading || create.isPending}>
            {create.isPending ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
