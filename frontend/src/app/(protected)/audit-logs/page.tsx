'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import type { AuditLog, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const ACTION_OPTIONS = [
  { label: 'All actions', value: '' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Restore', value: 'RESTORE' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Submit', value: 'SUBMIT' },
  { label: 'Approve', value: 'APPROVE' },
  { label: 'Reject', value: 'REJECT' },
  { label: 'Resubmit', value: 'RESUBMIT' },
  { label: 'Withdraw', value: 'WITHDRAW' },
  { label: 'Release', value: 'RELEASE' },
  { label: 'Mark paid', value: 'MARK_PAID' },
  { label: 'Upload proof', value: 'UPLOAD_PROOF' },
  { label: 'Cancel', value: 'CANCEL' },
];

const OUTCOME_OPTIONS = [
  { label: 'All outcomes', value: '' },
  { label: 'Succeeded', value: 'true' },
  { label: 'Failed', value: 'false' },
];

/** Colour an action chip by its broad category. */
function actionClass(action: string): string {
  if (['DELETE', 'REJECT', 'CANCEL', 'WITHDRAW'].includes(action))
    return 'bg-destructive/10 text-destructive ring-destructive/20';
  if (['CREATE', 'APPROVE', 'RELEASE', 'MARK_PAID', 'LOGIN'].includes(action))
    return 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20';
  return 'bg-muted text-muted-foreground ring-border';
}

export default function AuditLogsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (action) u.set('action', action);
    if (success) u.set('success', success);
    return u.toString();
  }, [page, search, action, success]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.get<Paginated<AuditLog>>(`/audit-logs?${params}`),
  });

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Every create, update, delete, and workflow action performed through the system."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, path or resource"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-72"
            />
          </div>
          <Select
            options={ACTION_OPTIONS}
            value={action}
            onChange={(e) => { setPage(1); setAction(e.target.value); }}
            className="w-44"
          />
          <Select
            options={OUTCOME_OPTIONS}
            value={success}
            onChange={(e) => { setPage(1); setSuccess(e.target.value); }}
            className="w-40"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">When</TableHead>
              <TableHead className="w-32">Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-24 text-center">Outcome</TableHead>
              <TableHead className="w-20 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? data.data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${actionClass(log.action)}`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{log.entityType ?? '—'}</span>
                  {log.entityId && (
                    <span className="block text-xs text-muted-foreground">{log.entityId}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{log.userEmail ?? '—'}</TableCell>
                <TableCell className="text-center">
                  {log.success ? (
                    <span className="text-xs font-medium text-emerald-600">OK</span>
                  ) : (
                    <span className="text-xs font-medium text-destructive">{log.statusCode ?? 'ERR'}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(log)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No audit entries match the current filters.</TableCell>
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
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Entry</DialogTitle>
          </DialogHeader>
          {selected && (
            <dl className="space-y-2 text-sm">
              <Row label="When" value={formatDateTime(selected.createdAt)} />
              <Row label="Action" value={selected.action} />
              <Row label="Resource" value={selected.entityType ?? '—'} />
              <Row label="Record ID" value={selected.entityId ?? '—'} />
              <Row label="User" value={selected.userEmail ?? '—'} />
              <Row label="Request" value={`${selected.httpMethod} ${selected.path}`} />
              <Row label="Status" value={String(selected.statusCode ?? '—')} />
              <Row label="Outcome" value={selected.success ? 'Succeeded' : 'Failed'} />
              <Row label="IP" value={selected.ipAddress ?? '—'} />
              <Row label="Duration" value={selected.durationMs != null ? `${selected.durationMs} ms` : '—'} />
              {selected.errorMessage && (
                <Row label="Error" value={selected.errorMessage} />
              )}
              {selected.requestBody && (
                <div>
                  <dt className="mb-1 text-muted-foreground">Request body</dt>
                  <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(selected.requestBody, null, 2)}
                  </pre>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-all font-medium">{value}</dd>
    </div>
  );
}
