'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Lock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Paginated, PaymentRequest, PaymentRequestStatus } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── constants ────────────────────────────────────────────────────────────────

const KEY = 'chairman-payment-requests';

type TabStatus =
  | 'AWAITING_MAKER_PREP'
  | 'AWAITING_CHECKER_REVIEW'
  | 'AWAITING_HEAD_APPROVAL'
  | 'AWAITING_PAYMENT_CONFIRMATION'
  | 'ALL';

interface TabDef {
  key: TabStatus;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'AWAITING_MAKER_PREP', label: 'Awaiting Preparation' },
  { key: 'AWAITING_CHECKER_REVIEW', label: 'Awaiting Verification' },
  { key: 'AWAITING_HEAD_APPROVAL', label: 'Awaiting Head Approval' },
  { key: 'AWAITING_PAYMENT_CONFIRMATION', label: 'Awaiting Payment' },
  { key: 'ALL', label: 'All' },
];

const STATUS_LABEL: Partial<Record<PaymentRequestStatus, string>> = {
  DRAFT: 'Draft',
  AWAITING_MAKER_PREP: 'Awaiting Preparation',
  AWAITING_CHECKER_REVIEW: 'Awaiting Verification',
  AWAITING_HEAD_APPROVAL: 'Awaiting Head Approval',
  AWAITING_PAYMENT_CONFIRMATION: 'Awaiting Payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_STYLE: Partial<Record<PaymentRequestStatus, string>> = {
  DRAFT: 'bg-muted text-muted-foreground',
  AWAITING_MAKER_PREP: 'bg-amber-500/10 text-amber-700',
  AWAITING_CHECKER_REVIEW: 'bg-blue-500/10 text-blue-700',
  AWAITING_HEAD_APPROVAL: 'bg-violet-500/10 text-violet-700',
  AWAITING_PAYMENT_CONFIRMATION: 'bg-orange-500/10 text-orange-700',
  PAID: 'bg-emerald-500/10 text-emerald-700',
  CANCELLED: 'bg-muted text-muted-foreground',
  WITHDRAWN: 'bg-muted text-muted-foreground',
};

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentRequestStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/**
 * Beneficiary display — the API masks the name/account for non-execution roles.
 * If masked, show a lock icon + italic "Confidential".
 */
function BeneficiaryCell({ pr }: { pr: PaymentRequest }): React.ReactElement {
  const ben = pr.chairmanBeneficiary;
  if (!ben) return <span className="text-muted-foreground">—</span>;

  const isConfidential = ben.accountHolderName === 'Confidential';
  if (isConfidential) {
    return (
      <span className="inline-flex items-center gap-1.5 italic text-muted-foreground text-sm">
        <Lock className="h-3.5 w-3.5" />
        Confidential
      </span>
    );
  }

  return (
    <span className="text-sm">
      <span className="font-medium">{ben.accountHolderName}</span>
      <span className="ml-1 text-xs text-muted-foreground">— {ben.accountNumber}</span>
    </span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ChairmanPaymentsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabStatus>('AWAITING_MAKER_PREP');
  const [page, setPage] = useState(1);

  const statusParam = activeTab === 'ALL' ? '' : `&status=${activeTab}`;

  const { data, isLoading } = useQuery({
    queryKey: [KEY, activeTab, page],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        `/payment-requests?isChairmanPayment=true${statusParam}&page=${page}&limit=20`,
      ),
  });

  function handleTabChange(tab: TabStatus) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Chairman Payment Queue"
        description="Confidential chairman payments — Maker preparation, Checker verification, Head approval."
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-36">Submitted At</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell className="font-mono text-sm">{pr.requestNumber}</TableCell>
                  <TableCell>
                    <BeneficiaryCell pr={pr} />
                  </TableCell>
                  <TableCell className="text-sm">{pr.currencyCode}</TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {Number(pr.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pr.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {pr.submittedAt ? new Date(pr.submittedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/payment-requests/${pr.id}`}>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No chairman payments found.
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
    </div>
  );
}
