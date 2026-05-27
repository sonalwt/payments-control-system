'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Employee, LegalEntity, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { EmployeeForm, type EmployeeFormData } from './employee-form';

const KEY = 'employees';

export default function EmployeesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [legalEntityId, setLegalEntityId] = useState<string>('');
  const [payrollCategory, setPayrollCategory] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const { data: entities } = useQuery({
    queryKey: ['legal-entities-all'],
    queryFn: () =>
      api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=100'),
  });

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    if (legalEntityId) u.set('legalEntityId', legalEntityId);
    if (payrollCategory) u.set('payrollCategory', payrollCategory);
    return u.toString();
  }, [page, search, legalEntityId, payrollCategory]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Employee>>(`/employees?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (input: EmployeeFormData) =>
      api.post<Employee>('/employees', sanitize(input)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setCreateOpen(false);
      notify.success('Employee created');
    },
    onError: (err: Error) =>
      notify.error('Create failed', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmployeeFormData }) => {
      const sanitized = sanitize(input);
      const {
        employeeCode: _code,
        legalEntityId: _entity,
        ...rest
      } = sanitized;
      void _code;
      void _entity;
      return api.put<Employee>(`/employees/${id}`, rest);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setEditing(null);
      notify.success('Employee updated');
    },
    onError: (err: Error) =>
      notify.error('Update failed', err),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del<void>(`/employees/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] });
      setDeleting(null);
      notify.success('Employee deleted');
    },
    onError: (err: Error) =>
      notify.error('Delete failed', err),
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Employee master. Sensitive payroll fields (national ID, tax ID, DOB, compensation band) are masked unless your role grants Payroll PII access. Bank account changes flow through the dedicated change-control workflow."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm
                submitting={createMutation.isPending}
                onSubmit={(d) => createMutation.mutate(d)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or email"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-80"
            />
          </div>
          <Select
            className="w-56"
            options={[
              { label: 'All entities', value: '' },
              ...(entities?.data ?? []).map((e) => ({
                label: `${e.code} — ${e.name}`,
                value: e.id,
              })),
            ]}
            value={legalEntityId}
            onChange={(e) => {
              setPage(1);
              setLegalEntityId(e.target.value);
            }}
          />
          <Select
            className="w-44"
            options={[
              { label: 'All categories', value: '' },
              { label: 'Staff', value: 'STAFF' },
              { label: 'Executive', value: 'EXEC' },
              { label: 'Contractor', value: 'CONTRACTOR' },
              { label: 'Intern', value: 'INTERN' },
            ]}
            value={payrollCategory}
            onChange={(e) => {
              setPage(1);
              setPayrollCategory(e.target.value);
            }}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Bank account</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? (
              data.data.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {emp.employeeCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{emp.fullName}</div>
                    {emp.workEmail && (
                      <div className="text-xs text-muted-foreground">
                        {emp.workEmail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {emp.legalEntity?.code ?? '—'}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{emp.countryCode}</code>
                  </TableCell>
                  <TableCell className="text-xs">
                    {emp.baseCurrency?.code ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge tone="blue">{emp.payrollCategory}</Badge>
                  </TableCell>
                  <TableCell>
                    {emp.employeeBankAccountId ? (
                      <Badge tone="green">Linked</Badge>
                    ) : (
                      <Badge tone="amber">Not linked</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={emp.isActive ? 'green' : 'gray'}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(emp)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleting(emp)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-muted-foreground"
                >
                  No employees yet.
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editing && (
            <EmployeeForm
              defaultValues={editing}
              identityLocked
              submitting={updateMutation.isPending}
              onSubmit={(d) =>
                updateMutation.mutate({ id: editing.id, input: d })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete employee "${deleting?.fullName}"?`}
        description="Soft-deletes the employee. Historical payroll references are preserved."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

// Strip empty optional strings so the backend treats them as omitted, not as
// empty-string values that fail @IsEmail / @IsDateString.
function sanitize(input: EmployeeFormData): EmployeeFormData {
  const blank = (s?: string | null): string | null =>
    s && s.length > 0 ? s : null;
  return {
    ...input,
    preferredName: blank(input.preferredName) ?? undefined,
    workEmail: blank(input.workEmail) ?? undefined,
    employmentStartDate: blank(input.employmentStartDate) ?? undefined,
    employmentEndDate: blank(input.employmentEndDate) ?? undefined,
    nationalId: blank(input.nationalId) ?? undefined,
    taxIdentifier: blank(input.taxIdentifier) ?? undefined,
    dateOfBirth: blank(input.dateOfBirth) ?? undefined,
    compensationBand: blank(input.compensationBand) ?? undefined,
  } as EmployeeFormData;
}

type BadgeTone = 'gray' | 'green' | 'amber' | 'blue' | 'purple' | 'red';

function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}): React.ReactElement {
  const tones: Record<BadgeTone, string> = {
    gray: 'bg-muted text-foreground',
    green: 'bg-green-500/10 text-green-700 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    red: 'bg-destructive/10 text-destructive',
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
