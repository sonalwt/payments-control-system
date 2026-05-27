'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ExceptionReport, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

const KEY = 'exception-reports';

export default function ExceptionReportsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ExceptionReport | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [KEY, page],
    queryFn: () =>
      api.get<Paginated<ExceptionReport>>(`/exception-reports?page=${page}&limit=20`),
  });

  // Manual trigger to (re)generate today's report on demand.
  const generateMutation = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().slice(0, 10);
      return api.post<ExceptionReport>(`/exception-reports/generate/${today}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      notify.success('Report generated for today');
    },
    onError: (e: Error) =>
      notify.error('Generate failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Proof-of-Payment Exception Reports"
        description="Daily report of PAID requests still missing a proof-of-payment document. Generated automatically at 23:55 each day."
        actions={
          <Button
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            {generateMutation.isPending ? 'Generating…' : 'Run for Today'}
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Date</TableHead>
              <TableHead className="text-right">Missing Proof</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="w-24 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.reportDate}</TableCell>
                  <TableCell className="text-right">
                    {r.totalMissing > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        {r.totalMissing}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                        All clear
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.generatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(r)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No exception reports yet. Click &quot;Run for Today&quot; to generate the first one.
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Exception Report — {selected?.reportDate}
            </DialogTitle>
          </DialogHeader>

          {selected?.totalMissing === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All paid requests for this date had proof of payment attached.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                The following {selected?.totalMissing} payment request(s) were marked
                PAID on {selected?.reportDate} but are still missing a proof-of-payment
                document. Please attach the relevant SWIFT MT103 / debit advice / bank
                screenshot as soon as possible.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selected?.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {item.requestNumber}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs">{item.legalEntityName ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.currencyCode}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(item.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.paidAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/payment-requests/${item.paymentRequestId}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Attach Proof
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
