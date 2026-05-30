'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Employee, Paginated } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { EmployeeForm, type EmployeeFormData } from './employee-form';

const KEY = 'employees';

function Field({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value === '' || value == null ? <span className="text-muted-foreground">—</span> : value}</div>
    </div>
  );
}

function EmployeeDetails({ employee: e }: { employee: Employee }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Employee code" value={<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.employeeCode}</code>} />
        <Field label="Status" value={
          <span
            className={
              e.isActive
                ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
            }
          >
            {e.isActive ? 'Active' : 'Inactive'}
          </span>
        } />
        <Field label="Full name" value={e.fullName} />
        <Field label="Work email" value={e.workEmail} />
        <Field label="Country of employment" value={e.countryOfEmployment ? `${e.countryOfEmployment.code} — ${e.countryOfEmployment.countryName}` : null} />
        <Field label="Start date" value={e.startDate} />
        <Field label="End date" value={e.endDate} />
        <Field label="National ID" value={e.nationalId} />
        <Field label="Tax identifier" value={e.taxIdentifier} />
        <Field label="Date of birth" value={e.dateOfBirth} />
        <Field label="Mobile number" value={e.mobileNumber} />
        <Field label="Compensation band" value={e.compensationBand} />
      </div>
      <Field label="Address" value={e.address ? <span className="whitespace-pre-wrap">{e.address}</span> : null} />
    </div>
  );
}

function normalize(d: EmployeeFormData) {
  const blank = (v?: string) => (v && v.length > 0 ? v : undefined);
  return {
    employeeCode: d.employeeCode,
    fullName: d.fullName,
    workEmail: d.workEmail,
    countryOfEmploymentId: d.countryOfEmploymentId,
    startDate: blank(d.startDate),
    endDate: blank(d.endDate),
    nationalId: blank(d.nationalId),
    taxIdentifier: blank(d.taxIdentifier),
    dateOfBirth: blank(d.dateOfBirth),
    mobileNumber: blank(d.mobileNumber),
    address: blank(d.address),
    compensationBand: blank(d.compensationBand),
    isActive: d.isActive ?? true,
  };
}

export default function EmployeesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Employee>>(`/employees?${params}`),
  });

  const createMut = useMutation({
    mutationFn: (i: EmployeeFormData) => api.post<Employee>('/employees', normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setCreateOpen(false); notify.success('Employee created'); },
    onError: (e: Error) => notify.error('Create failed', e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, i }: { id: string; i: EmployeeFormData }) => api.put<Employee>(`/employees/${id}`, normalize(i)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setEditing(null); notify.success('Updated'); },
    onError: (e: Error) => notify.error('Update failed', e),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/employees/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [KEY] }); setDeleting(null); notify.success('Deleted'); },
    onError: (e: Error) => notify.error('Delete failed', e),
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Master list of employees (Super Admin only)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Create employee</DialogTitle></DialogHeader>
              <EmployeeForm submitting={createMut.isPending} onSubmit={(d) => createMut.mutate(d)} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, code or email" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="max-w-md" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Full name</TableHead>
              <TableHead>Work email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((e) => (
              <TableRow key={e.id}>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.employeeCode}</code></TableCell>
                <TableCell className="font-medium">{e.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{e.workEmail ?? '—'}</TableCell>
                <TableCell>{e.countryOfEmployment ? `${e.countryOfEmployment.code} — ${e.countryOfEmployment.countryName}` : '—'}</TableCell>
                <TableCell>
                  <span
                    className={
                      e.isActive
                        ? 'inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : 'inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border'
                    }
                  >
                    {e.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(e)} title="View"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(e)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(e)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No employees yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Employee details</DialogTitle></DialogHeader>
          {viewing && <EmployeeDetails employee={viewing} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit employee</DialogTitle></DialogHeader>
          {editing && (
            <EmployeeForm
              defaultValues={editing}
              submitting={updateMut.isPending}
              onSubmit={(d) => updateMut.mutate({ id: editing.id, i: d })}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.fullName}"?`}
        description="This will soft-delete the employee."
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
