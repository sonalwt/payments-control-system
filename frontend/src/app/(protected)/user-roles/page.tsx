'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ShieldCheck, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { hasAnyRole, RoleCode } from '@/lib/roles';
import type { Paginated, Role, User, UserRole } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotify } from '@/hooks/use-notify';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const schema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});
type FormData = z.infer<typeof schema>;

const roleSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE'),
  name: z.string().min(2).max(100),
  description: z.string().optional().or(z.literal('')),
});
type RoleFormData = z.infer<typeof roleSchema>;

const editRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional().or(z.literal('')),
});
type EditRoleFormData = z.infer<typeof editRoleSchema>;

export default function UserRolesPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId') ?? '';
  const [selectedUserId, setSelectedUserId] = useState<string>(userIdParam);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<UserRole | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = hasAnyRole(user?.roles, [RoleCode.SUPER_ADMIN]);

  const { data: users } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200'),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });

  // Prefer the user named in the URL (?userId=…), e.g. when arriving from the
  // "Manage roles" link; otherwise auto-select the first user once loaded.
  useEffect(() => {
    if (!users || users.data.length === 0) return;
    if (userIdParam && users.data.some((u) => u.id === userIdParam)) {
      setSelectedUserId(userIdParam);
    } else if (!selectedUserId) {
      setSelectedUserId(users.data[0]!.id);
    }
  }, [users, selectedUserId, userIdParam]);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['user-roles', selectedUserId],
    queryFn: () => api.get<UserRole[]>(`/user-roles/user/${selectedUserId}`),
    enabled: Boolean(selectedUserId),
  });

  const userOptions = useMemo(
    () => (users?.data ?? []).map((u) => ({ label: `${u.fullName} — ${u.email}`, value: u.id })),
    [users],
  );

  // Only offer roles the user doesn't already have
  const assignableRoles = useMemo(() => {
    const assigned = new Set((assignments ?? []).map((a) => a.roleId));
    return (roles ?? []).filter((r) => !assigned.has(r.id));
  }, [roles, assignments]);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userId: selectedUserId, roleId: '' },
  });

  useEffect(() => { setValue('userId', selectedUserId); }, [selectedUserId, setValue]);

  const assignMut = useMutation({
    mutationFn: (data: FormData) => api.post<UserRole>('/user-roles', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-roles', selectedUserId] });
      setAssignOpen(false);
      reset({ userId: selectedUserId, roleId: '' });
      notify.success('Role assigned');
    },
    onError: (err: Error) => notify.error('Failed to assign role', err),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/user-roles/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-roles', selectedUserId] });
      setDeleting(null);
      notify.success('Role revoked');
    },
    onError: (err: Error) => notify.error('Failed to revoke role', err),
  });

  // ── Create role form ────────────────────────────────────────────────────────
  const {
    register: registerRole,
    handleSubmit: handleRoleSubmit,
    formState: { errors: roleErrors },
    reset: resetRoleForm,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const createRoleMut = useMutation({
    mutationFn: (data: RoleFormData) =>
      api.post<Role>('/roles', {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles-all'] });
      setCreateRoleOpen(false);
      resetRoleForm({ code: '', name: '', description: '' });
      notify.success('Role created');
    },
    onError: (err: Error) => notify.error('Failed to create role', err),
  });

  // ── Edit role form ──────────────────────────────────────────────────────────
  const {
    register: registerEditRole,
    handleSubmit: handleEditRoleSubmit,
    formState: { errors: editRoleErrors },
    reset: resetEditRoleForm,
  } = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  // Pre-populate the edit form whenever a role is selected for editing
  useEffect(() => {
    if (editingRole) {
      resetEditRoleForm({
        name: editingRole.name,
        description: editingRole.description ?? '',
      });
    }
  }, [editingRole, resetEditRoleForm]);

  const editRoleMut = useMutation({
    mutationFn: (data: EditRoleFormData) =>
      api.put<Role>(`/roles/${editingRole!.id}`, {
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles-all'] });
      setEditingRole(null);
      notify.success('Role updated');
    },
    onError: (err: Error) => notify.error('Failed to update role', err),
  });

  // ── Delete role ─────────────────────────────────────────────────────────────
  const deleteRoleMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/roles/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles-all'] });
      setDeletingRole(null);
      notify.success('Role deleted');
    },
    onError: (err: Error) => notify.error('Failed to delete role', err),
  });

  const selectedUser = (users?.data ?? []).find((u) => u.id === selectedUserId);

  return (
    <div>
      <PageHeader
        title="Role Assignment"
        description="Assign or revoke roles for each user"
        actions={isAdmin ? (
          <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create role</DialogTitle></DialogHeader>
              <form onSubmit={handleRoleSubmit((d) => createRoleMut.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newRoleCode">Code <span className="text-destructive">*</span></Label>
                    <Input id="newRoleCode" placeholder="CUSTOM_ROLE" {...registerRole('code')} />
                    {roleErrors.code && <p className="text-xs text-destructive">{roleErrors.code.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newRoleName">Name <span className="text-destructive">*</span></Label>
                    <Input id="newRoleName" placeholder="Custom Role" {...registerRole('name')} />
                    {roleErrors.name && <p className="text-xs text-destructive">{roleErrors.name.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newRoleDescription">Description</Label>
                  <Textarea id="newRoleDescription" rows={2} {...registerRole('description')} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createRoleMut.isPending}>
                    {createRoleMut.isPending ? 'Creating…' : 'Create role'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {/* Roles management table */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              {isAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(roles ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (roles ?? []).map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {role.name}
                    {role.isSystem && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        system
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                    {role.code}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {role.description ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Edit role"
                        onClick={() => setEditingRole(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete role"
                        onClick={() => setDeletingRole(role)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* User picker */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Select user</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <Select
              placeholder="Choose a user…"
              options={userOptions}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignments table */}
      {selectedUserId && (
        <Card>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-medium">{selectedUser?.fullName}</p>
              <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
            </div>
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={assignableRoles.length === 0}>
                  <Plus className="mr-2 h-4 w-4" /> Assign role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign role</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit((d) => assignMut.mutate(d))} className="space-y-4">
                  <input type="hidden" {...register('userId')} />
                  <div className="space-y-2">
                    <Label htmlFor="roleId">Role</Label>
                    <Select
                      id="roleId"
                      placeholder="Select a role…"
                      options={assignableRoles.map((r) => ({
                        label: `${r.name} (${r.code})`,
                        value: r.id,
                      }))}
                      {...register('roleId')}
                    />
                    {errors.roleId && (
                      <p className="text-xs text-destructive">{errors.roleId.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={assignMut.isPending}>
                      {assignMut.isPending ? 'Assigning…' : 'Assign'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : assignments && assignments.length > 0 ? (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {a.role?.name ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {a.role?.code ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.role?.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(a)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No roles assigned to this user.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit role dialog */}
      <Dialog open={!!editingRole} onOpenChange={(o) => !o && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role — {editingRole?.code}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditRoleSubmit((d) => editRoleMut.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editRoleName">Name <span className="text-destructive">*</span></Label>
              <Input id="editRoleName" {...registerEditRole('name')} />
              {editRoleErrors.name && (
                <p className="text-xs text-destructive">{editRoleErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Description</Label>
              <Textarea id="editRoleDescription" rows={2} {...registerEditRole('description')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editRoleMut.isPending}>
                {editRoleMut.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete role */}
      <ConfirmDelete
        open={!!deletingRole}
        onOpenChange={(o) => !o && setDeletingRole(null)}
        title="Delete role?"
        description={`Permanently delete "${deletingRole?.name}"? Users currently assigned this role will lose it.`}
        loading={deleteRoleMut.isPending}
        onConfirm={() => deletingRole && deleteRoleMut.mutate(deletingRole.id)}
      />

      {/* Confirm revoke user role assignment */}
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Revoke role?"
        description={`Remove "${deleting?.role?.name}" from this user?`}
        loading={revokeMut.isPending}
        onConfirm={() => deleting && revokeMut.mutate(deleting.id)}
      />
    </div>
  );
}
