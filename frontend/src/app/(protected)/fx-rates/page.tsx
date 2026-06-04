'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Edit3, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import type { FxRate, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';

const KEY = 'fx-rates';

interface OverridePayload {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: string;
  asOfDate?: string;
  reason: string;
}

interface FetchResponse {
  fetched: number;
  heldStale: number;
  asOfDate: string;
  providerName: string;
}

function sourceLabel(s: FxRate['source']): { label: string; cls: string } {
  switch (s) {
    case 'OANDA':
      return { label: 'OANDA', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' };
    case 'MANUAL_OVERRIDE':
      return { label: 'Override', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' };
    case 'STALE_HELD':
      return { label: 'Stale', cls: 'bg-red-500/10 text-red-700 dark:text-red-400' };
  }
}

export default function FxRatesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) u.set('quote', search.trim().toUpperCase());
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<FxRate>>(`/fx-rates?${params}`),
  });

  const fetchMutation = useMutation({
    mutationFn: () => api.post<FetchResponse>('/fx-rates/fetch', {}),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      notify.success(`Fetched ${r.fetched} rates from ${r.providerName}`, `${r.heldStale} held as stale for ${r.asOfDate}.`);
    },
    onError: (err: Error) =>
      notify.error('Fetch failed', err),
  });

  const overrideMutation = useMutation({
    mutationFn: (input: OverridePayload) =>
      api.post<FxRate>('/fx-rates/override', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setOverrideOpen(false);
      notify.success('Rate overridden');
    },
    onError: (err: Error) =>
      notify.error('Override failed', err),
  });

  return (
    <div>
      <PageHeader
        title="FX Rates"
        description="Daily OANDA mid-rates against USD reporting currency (§2.2). Used for USD-equivalent displays on consolidated dashboards and the §2.6 indicative cross-currency min-balance check."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchMutation.mutate()}
              disabled={fetchMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {fetchMutation.isPending ? 'Fetching…' : 'Fetch today'}
            </Button>
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Edit3 className="mr-2 h-4 w-4" /> Manual override
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Override rate</DialogTitle>
                  <DialogDescription>
                    Overrides the recorded rate for the day and is logged with
                    the supplied reason. Effective immediately.
                  </DialogDescription>
                </DialogHeader>
                <OverrideForm
                  submitting={overrideMutation.isPending}
                  onSubmit={(d) => overrideMutation.mutate(d)}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by quote currency (e.g. EUR)"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-72"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Base</TableHead>
              <TableHead className="w-24">Quote</TableHead>
              <TableHead className="w-40 text-right">Rate</TableHead>
              <TableHead className="w-32">As of</TableHead>
              <TableHead className="w-28">Source</TableHead>
              <TableHead>Provider / Reason</TableHead>
              <TableHead className="w-40">Last updated</TableHead>
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
              data.data.map((r) => {
                const s = sourceLabel(r.source);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                        {r.baseCurrencyCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                        {r.quoteCurrencyCode}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {Number(r.rate).toFixed(6)}
                    </TableCell>
                    <TableCell>{r.asOfDate}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${s.cls}`}>
                        {r.source === 'STALE_HELD' && <AlertTriangle className="h-3 w-3" />}
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {r.source === 'MANUAL_OVERRIDE'
                          ? r.overrideReason ?? '—'
                          : r.providerName ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(r.fetchedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No rates recorded yet — click "Fetch today" or add an override.
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

function OverrideForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (data: OverridePayload) => void;
}): React.ReactElement {
  const [baseCurrencyCode, setBase] = useState('USD');
  const [quoteCurrencyCode, setQuote] = useState('');
  const [rate, setRate] = useState('');
  const [asOfDate, setAsOfDate] = useState('');
  const [reason, setReason] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          baseCurrencyCode: baseCurrencyCode.trim().toUpperCase(),
          quoteCurrencyCode: quoteCurrencyCode.trim().toUpperCase(),
          rate: rate.trim(),
          asOfDate: asOfDate.trim() || undefined,
          reason: reason.trim(),
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="base">Base</Label>
          <Input
            id="base"
            value={baseCurrencyCode}
            onChange={(e) => setBase(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
        </div>
        <div>
          <Label htmlFor="quote">Quote</Label>
          <Input
            id="quote"
            value={quoteCurrencyCode}
            onChange={(e) => setQuote(e.target.value.toUpperCase())}
            maxLength={3}
            required
            placeholder="EUR"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="rate">Rate (base 1 → quote)</Label>
          <Input
            id="rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.9234"
            required
          />
        </div>
        <div>
          <Label htmlFor="asOfDate">As-of date</Label>
          <Input
            id="asOfDate"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Treasury-confirmed cross rate per CFO email 2026-05-24."
          required
        />
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Override rate'}
        </Button>
      </DialogFooter>
    </form>
  );
}
