'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search } from 'lucide-react';
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
  username: string;
  email: string;
  fullName: string;
  password: string;
  employeeCode: string;
  isActive: boolean;
}

const EMPTY_FORM: CreateUserForm = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  employeeCode: '',
  isActive: true,
};

/** Edit form — username is the login handle, shown read-only and never sent. */
interface EditUserForm {
  id: string;
  username: string;
  email: string;
  fullName: string;
  employeeCode: string;
  isActive: boolean;
}

export default function UsersPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

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
        username: body.username,
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

  const updateMutation = useMutation({
    // username is the login handle and is intentionally not sent (immutable).
    mutationFn: (body: EditUserForm) =>
      api.put<User>(`/users/${body.id}`, {
        email: body.email,
        fullName: body.fullName,
        employeeCode: body.employeeCode || undefined,
        isActive: body.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditForm(null);
      setEditError(null);
    },
    onError: (err) => setEditError(friendlyError(err)),
  });

  function openDialog() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(u: User) {
    setEditError(null);
    setEditForm({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      employeeCode: u.employeeCode ?? '',
      isActive: u.isActive,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(form);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setEditError(null);
    updateMutation.mutate(editForm);
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
              sampleHeaders={['username', 'email', 'full_name', 'password', 'employee_code', 'is_active']}
              sampleRows={[['john.smith', 'john.smith@company.com', 'John Smith', 'Temp@1234', 'EMP001', 'true']]}
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
            placeholder="Search by name, username or email"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Employee code</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-52 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : data && data.data.length > 0 ? data.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
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
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(u)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/user-roles?userId=${u.id}`}>Manage roles</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No users yet.</TableCell>
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
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                placeholder="jane.doe"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
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

      {/* Edit User dialog */}
      <Dialog open={editForm !== null} onOpenChange={(open) => { if (!open) setEditForm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="edit-username">Username</Label>
                <Input id="edit-username" value={editForm.username} readOnly disabled />
                <p className="text-xs text-muted-foreground">
                  The username is used to sign in and cannot be changed.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, email: e.target.value } : f))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-fullName">Full name <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-fullName"
                  placeholder="Jane Doe"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-employeeCode">Employee code</Label>
                <Input
                  id="edit-employeeCode"
                  placeholder="Optional"
                  value={editForm.employeeCode}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, employeeCode: e.target.value } : f))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-isActive"
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, isActive: e.target.checked } : f))}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>

              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
