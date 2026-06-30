'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileUp } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  BankAccount,
  Counterparty,
  Currency,
  IncomingReceipt,
  LegalEntity,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';

interface DocDraft {
  documentCode: string;
  documentLabel: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export default function NewIncomingReceiptPage(): React.ReactElement {
  const router = useRouter();
  const notify = useNotify();

  const [legalEntityId, setLegalEntityId] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [receiveFromAccountId, setReceiveFromAccountId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [receivedFromAccount, setReceivedFromAccount] = useState('');
  const [docs, setDocs] = useState<DocDraft[]>([]);
  const [uploading, setUploading] = useState(false);

  const entities = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=100'),
  });
  const counterparties = useQuery({
    queryKey: ['counterparties-all'],
    queryFn: () => api.get<Paginated<Counterparty>>('/counterparties?page=1&limit=100'),
  });
  const currencies = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<Paginated<Currency>>('/currencies?page=1&limit=100'),
  });
  // Group-own bank accounts. The list endpoint only whitelists page/limit/
  // search, and bank accounts aren't linked to a legal entity, so we fetch all
  // and filter active ones client-side (passing ?legalEntityId 400s).
  const accounts = useQuery({
    queryKey: ['bank-accounts-all'],
    queryFn: () => api.get<Paginated<BankAccount>>('/bank-accounts?page=1&limit=200'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, fileName } = await api.upload(file);
      setDocs((d) => [
        ...d,
        {
          documentCode: 'SUPPORTING_DOC',
          documentLabel: 'Supporting Document',
          fileName,
          fileUrl: url,
          fileSizeBytes: file.size,
          mimeType: file.type,
        },
      ]);
      notify.success('Document uploaded');
    } catch (err) {
      notify.error('Upload failed', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<IncomingReceipt>('/incoming-receipts', {
        legalEntityId,
        counterpartyId,
        receiveFromAccountId,
        expectedAmount: amount,
        expectedCurrencyCode: currencyCode.toUpperCase(),
        purposeDescription: purpose || undefined,
        receivedFromAccount: receivedFromAccount || undefined,
        documents: docs.length > 0 ? docs : undefined,
      }),
    onSuccess: (ir) => {
      notify.success(`Receipt ${ir.receiptNumber} created`);
      router.push(`/incoming-receipts/${ir.id}`);
    },
    onError: (err: Error) =>
      notify.error('Create failed', err),
  });

  const canSubmit =
    !!legalEntityId &&
    !!counterpartyId &&
    !!receiveFromAccountId &&
    !!currencyCode &&
    !!amount &&
    parseFloat(amount) > 0 &&
    docs.length > 0;

  const accountOpts = (accounts.data?.data ?? []).filter((a) => a.isActive);

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Incoming Receipt"
        description="SOW §7.1 — record an inbound credit expected from a counterparty."
        actions={
          <Link href="/incoming-receipts">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="entity">Legal Entity *</Label>
            <select
              id="entity"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={legalEntityId}
              onChange={(e) => {
                setLegalEntityId(e.target.value);
                setReceiveFromAccountId('');
              }}
            >
              <option value="">Select…</option>
              {(entities.data?.data ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
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
                  <option key={c.id} value={c.code ?? ''}>
                    {c.code} — {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="receive-from">Receive-to Account *</Label>
            <select
              id="receive-from"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={receiveFromAccountId}
              onChange={(e) => setReceiveFromAccountId(e.target.value)}
            >
              <option value="">Select…</option>
              {accountOpts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankNickname ?? a.bankName ?? 'Account'} — {a.accountNumber} ({a.currency?.code ?? '—'})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              The group bank account expected to receive this credit.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="received-from-account">Received-from Account</Label>
            <Input
              id="received-from-account"
              value={receivedFromAccount}
              onChange={(e) => setReceivedFromAccount(e.target.value)}
              className="mt-1"
              placeholder="Counterparty account / IBAN (optional)"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional — the counterparty bank account the credit is expected from.
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
            <Label>Supporting Document *</Label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>
            {docs.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <FileUp className="h-3.5 w-3.5" />
                    {d.fileName}
                    <button
                      type="button"
                      onClick={() => setDocs(docs.filter((_, idx) => idx !== i))}
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
          <Link href="/incoming-receipts">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Creating…' : 'Create Draft'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
