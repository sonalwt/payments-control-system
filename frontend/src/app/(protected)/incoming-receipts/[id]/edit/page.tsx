'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, FileUp } from 'lucide-react';
import { api, friendlyError, resolveFileUrl } from '@/lib/api';
import type {
  BankAccount,
  Counterparty,
  Currency,
  IncomingReceipt,
  IncomingReceiptDocument,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';

const KEY = 'incoming-receipts';

interface DocDraft {
  documentCode: string;
  documentLabel: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export default function EditIncomingReceiptPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const notify = useNotify();

  const ir = useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<IncomingReceipt>(`/incoming-receipts/${id}`),
  });

  const existingDocs = useQuery({
    queryKey: [KEY, id, 'docs'],
    queryFn: () => api.get<IncomingReceiptDocument[]>(`/incoming-receipts/${id}/documents`),
  });

  const counterparties = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=100'),
  });
  const currencies = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=100'),
  });
  const accounts = useQuery({
    queryKey: ['bank-accounts', ir.data?.legalEntityId],
    enabled: !!ir.data?.legalEntityId,
    queryFn: () =>
      api.get<Paginated<BankAccount>>(
        `/bank-accounts?legalEntityId=${ir.data!.legalEntityId}&page=1&limit=100`,
      ),
  });

  const [counterpartyId, setCounterpartyId] = useState('');
  const [receiveFromAccountId, setReceiveFromAccountId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [newDocs, setNewDocs] = useState<DocDraft[]>([]);
  const [uploading, setUploading] = useState(false);

  // Hydrate the form once the receipt loads.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!hydrated && ir.data) {
      setCounterpartyId(ir.data.counterpartyId);
      setReceiveFromAccountId(ir.data.receiveFromAccountId);
      setCurrencyCode(ir.data.expectedCurrencyCode);
      setAmount(ir.data.expectedAmount);
      setPurpose(ir.data.purposeDescription ?? '');
      setHydrated(true);
    }
  }, [ir.data, hydrated]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, fileName } = await api.upload(file);
      setNewDocs((d) => [
        ...d,
        {
          documentCode: 'DEBIT_NOTE',
          documentLabel: 'Debit Note / Final Invoice',
          fileName,
          fileUrl: url,
          fileSizeBytes: file.size,
          mimeType: file.type,
        },
      ]);
      notify.success('Document uploaded');
    } catch (err) {
      notify.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put<IncomingReceipt>(`/incoming-receipts/${id}`, {
        counterpartyId,
        receiveFromAccountId,
        expectedAmount: amount,
        expectedCurrencyCode: currencyCode.toUpperCase(),
        purposeDescription: purpose || undefined,
        documents: newDocs.length > 0 ? newDocs : undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      notify.success('Draft updated');
      router.push(`/incoming-receipts/${id}`);
    },
    onError: (err) =>
      notify.error('Update failed'),
  });

  if (ir.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!ir.data) {
    return <div className="p-6 text-sm text-muted-foreground">Receipt not found.</div>;
  }

  // §7 — Only drafts are editable.
  if (ir.data.status !== 'DRAFT') {
    return (
      <div className="space-y-4">
        <PageHeader
          title={`Incoming Receipt ${ir.data.receiptNumber}`}
          description="Edit unavailable for this status."
          actions={
            <Link href={`/incoming-receipts/${id}`}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to detail
              </Button>
            </Link>
          }
        />
        <Card className="p-6">
          <p className="text-sm">
            This receipt is currently in <strong>{ir.data.status}</strong> status. Only
            receipts in <strong>DRAFT</strong> status can be edited.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once a receipt has been submitted, marked received, or cancelled, its details
            are locked for audit purposes (SOW §7).
          </p>
        </Card>
      </div>
    );
  }

  const accountOpts = (accounts.data?.data ?? []).filter(
    (a) => a.isActive && a.accountType === 'CURRENT',
  );
  const attached = existingDocs.data ?? [];
  const canSave =
    !!counterpartyId &&
    !!receiveFromAccountId &&
    !!currencyCode &&
    !!amount &&
    parseFloat(amount) > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Edit Receipt ${ir.data.receiptNumber}`}
        description="SOW §7 — only DRAFT receipts are editable. Legal entity is locked."
        actions={
          <Link href={`/incoming-receipts/${id}`}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to detail
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Legal Entity</Label>
            <Input
              value={ir.data.legalEntity?.name ?? ir.data.legalEntityId}
              disabled
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Locked — legal entity cannot be changed after creation.
            </p>
          </div>

          <div>
            <Label htmlFor="counterparty">Counterparty *</Label>
            <select
              id="counterparty"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={counterpartyId}
              onChange={(e) => setCounterpartyId(e.target.value)}
            >
              <option value="">Select…</option>
              {(counterparties.data?.data ?? [])
                .filter((c) => c.isActive && (c.role === 'CUSTOMER' || c.role === 'BOTH'))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label htmlFor="amount">Expected Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency *</Label>
            <select
              id="currency"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              <option value="">Select…</option>
              {(currencies.data?.data ?? [])
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="receive-from">Receive-from Account *</Label>
            <select
              id="receive-from"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={receiveFromAccountId}
              onChange={(e) => setReceiveFromAccountId(e.target.value)}
            >
              <option value="">Select…</option>
              {accountOpts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname} — {a.accountNumber} ({a.currency?.code ?? '—'})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              The group bank account expected to receive this credit.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="purpose">Purpose / Notes</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Currently Attached Documents</Label>
            {attached.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">No documents attached yet.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {attached.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={resolveFileUrl(d.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {d.fileName}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      ({d.documentLabel ?? d.documentCode})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Existing documents stay attached. Uploads below are added to the receipt.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Add More Documents</Label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                onChange={handleUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or image only (.pdf, .jpg, .jpeg, .png, .tif, .tiff).
            </p>
            {newDocs.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {newDocs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <FileUp className="h-3.5 w-3.5" />
                    {d.fileName}
                    <button
                      type="button"
                      onClick={() => setNewDocs(newDocs.filter((_, idx) => idx !== i))}
                      className="ml-2 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Link href={`/incoming-receipts/${id}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            disabled={!canSave || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
