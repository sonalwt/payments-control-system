'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/datetime';
import type {
  IncomingReceipt,
  IncomingReceiptStatus,
  Paginated,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { ImportCsvDialog } from '@/components/shared/import-csv-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

const KEY = 'incoming-receipts';

const ALL_STATUSES: IncomingReceiptStatus[] = [
  'DRAFT',
  'AWAITING_RECEIPT',
  'RECEIVED',
  'CANCELLED',
];

const STATUS_LABEL: Record<IncomingReceiptStatus, string> = {
  DRAFT: 'Draft',
  AWAITING_RECEIPT: 'Awaiting Receipt',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<IncomingReceiptStatus, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  AWAITING_RECEIPT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  RECEIVED: 'bg-green-700/10 text-green-800 dark:text-green-300',
  CANCELLED: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: IncomingReceiptStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function IncomingReceiptsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncomingReceiptStatus | ''>('');

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (statusFilter) u.set('status', statusFilter);
    return u.toString();
  }, [page, search, statusFilter]);

  const list = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<IncomingReceipt>>(`/incoming-receipts?${params}`),
  });

  const data = list.data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incoming Receipts"
        description="SOW §7 — inbound credits expected from counterparties; mark received when the bank credit lands."
        actions={
          <div className="flex gap-2">
            <ImportCsvDialog
              entityName="Incoming Receipts"
              endpoint="/incoming-receipts/import"
              sampleHeaders={[
                'Legal Entity Code',
                'Counterparty Code',
                'Receive-to Account Number',
                'Expected Amount',
                'Currency Code',
                'Purpose',
              ]}
              sampleRows={[
                ['RADIANT-IN', 'CP-0001', '50100123456789', '12500.0000', 'USD', 'Advance against PO-2026-014'],
                ['RADIANT-DXB', 'CP-0002', '1015400987654', '8000.00', 'USD', 'Final settlement invoice INV-91'],
              ]}
              onSuccess={() => void list.refetch()}
            />
            <Link href="/incoming-receipts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Receipt
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipt number or purpose"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as IncomingReceiptStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Bank Account</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Inward Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                  No incoming receipts yet.
                </TableCell>
              </TableRow>
            )}
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    href={`/incoming-receipts/${r.id}`}
                    className="font-medium text-primary"
                  >
                    {r.receiptNumber}
                  </Link>
                </TableCell>
                <TableCell>{r.counterparty?.name ?? '—'}</TableCell>
                <TableCell>
                  {r.receiveFromAccount ? (
                    <div>
                      <div className="text-sm">
                        {r.receiveFromAccount.bank?.name ?? r.receiveFromAccount.bankName ?? '—'}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.receiveFromAccount.accountNumber}
                        {r.receiveFromAccount.currency?.code ? ` · ${r.receiveFromAccount.currency.code}` : ''}
                      </div>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {r.expectedAmount} {r.expectedCurrencyCode}
                </TableCell>
                <TableCell>
                  {r.receivedAmount
                    ? `${r.receivedAmount} ${r.receivedCurrencyCode}`
                    : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {r.inwardBankReference ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(r.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/incoming-receipts/${r.id}`}>
                    <Button size="icon" variant="ghost" title="View / Act">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete (draft only)"
                    disabled={r.status !== 'DRAFT'}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataTablePagination
          page={page}
          totalPages={list.data?.totalPages ?? 1}
          total={list.data?.total ?? 0}
          limit={list.data?.limit ?? 20}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
