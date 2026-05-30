'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
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

export default function UserRolesPage(): React.ReactElement {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserRole | null>(null);
  const notify = useNotify();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200'),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });

  // Auto-select first user once loaded
  useEffect(() => {
    if (!selectedUserId && users && users.data.length > 0) {
      setSelectedUserId(users.data[0]!.id);
    }
  }, [users, selectedUserId]);

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

  const selectedUser = (users?.data ?? []).find((u) => u.id === selectedUserId);

  return (
    <div>
      <PageHeader
        title="Role Assignment"
        description="Assign or revoke roles for each user"
        actions={
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
        }
      />

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
