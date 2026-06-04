'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import type { Paginated, User } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { ImportCsvDialog } from '@/components/shared/import-csv-dialog';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CreateUserForm {
  email: string;
  fullName: string;
  password: string;
  employeeCode: string;
  isActive: boolean;
}

const EMPTY_FORM: CreateUserForm = {
  email: '',
  fullName: '',
  password: '',
  employeeCode: '',
  isActive: true,
};

export default function UsersPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get<Paginated<User>>(`/users?${params}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserForm) =>
      api.post<User>('/users', {
        email: body.email,
        fullName: body.fullName,
        password: body.password,
        employeeCode: body.employeeCode || undefined,
        isActive: body.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormError(null);
    },
    onError: (err) => setFormError(friendlyError(err)),
  });

  function openDialog() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(form);
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Application users and their role assignments."
        actions={
          <div className="flex items-center gap-2">
            <ImportCsvDialog
              entityName="Users"
              endpoint="/users/import"
              sampleHeaders={['email', 'full_name', 'password', 'employee_code', 'is_active']}
              sampleRows={[['john.smith@company.com', 'John Smith', 'Temp@1234', 'EMP001', 'true']]}
              onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['users'] })}
            />
            <Button onClick={openDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Employee code</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? data.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.employeeCode ?? '—'}</TableCell>
                <TableCell>
                  {u.roles && u.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(u.lastLoginAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/user-roles?userId=${u.id}`}>Manage roles</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No users yet.</TableCell>
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

      {/* Add User dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full name <span className="text-destructive">*</span></Label>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="jane.doe@acme.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="employeeCode">Employee code</Label>
              <Input
                id="employeeCode"
                placeholder="Optional"
                value={form.employeeCode}
                onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
