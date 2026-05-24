'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  LegalEntity, Paginated, Role, User, UserEntityRole,
} from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

const schema = z.object({
  userId: z.string().uuid(),
  legalEntityId: z.string().uuid(),
  roleId: z.string().uuid(),
});
type FormData = z.infer<typeof schema>;

export default function UserRolesPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams?.get('userId') ?? '';
  const [selectedUserId, setSelectedUserId] = useState<string>(userIdFromQuery);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserEntityRole | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get<Paginated<User>>('/users?page=1&limit=200'),
  });
  const { data: legalEntities } = useQuery({
    queryKey: ['les-all'],
    queryFn: () => api.get<Paginated<LegalEntity>>('/legal-entities?page=1&limit=200'),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get<Role[]>('/roles'),
  });

  useEffect(() => {
    if (!selectedUserId && users && users.data.length > 0) {
      setSelectedUserId(users.data[0]!.id);
    }
  }, [users, selectedUserId]);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['user-entity-roles', selectedUserId],
    queryFn: () => api.get<UserEntityRole[]>(`/user-entity-roles/user/${selectedUserId}`),
    enabled: Boolean(selectedUserId),
  });

  const userOptions = useMemo(
    () => (users?.data ?? []).map((u) => ({ label: `${u.fullName} <${u.email}>`, value: u.id })),
    [users],
  );

  const {
    register, handleSubmit, formState: { errors }, reset, setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userId: selectedUserId, legalEntityId: '', roleId: '' },
  });
  useEffect(() => { setValue('userId', selectedUserId); }, [selectedUserId, setValue]);

  const assignMut = useMutation({
    mutationFn: (i: FormData) => api.post<UserEntityRole>('/user-entity-roles', i),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-entity-roles', selectedUserId] });
      setAssignOpen(false);
      reset({ userId: selectedUserId, legalEntityId: '', roleId: '' });
      toast({ title: 'Role assigned', variant: 'success' });
    },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => api.del<void>(`/user-entity-roles/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-entity-roles', selectedUserId] });
      setDeleting(null);
      toast({ title: 'Revoked', variant: 'success' });
    },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="User Role Assignment"
        description="Each row grants a user a role within a single legal entity"
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Select user</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <Select
              placeholder="Choose a user"
              options={userOptions}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {selectedUserId ? (
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <p className="text-sm text-muted-foreground">Active assignments</p>
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Assign role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign role</DialogTitle></DialogHeader>
                <form
                  onSubmit={handleSubmit((d) => assignMut.mutate(d))}
                  className="space-y-4"
                >
                  <input type="hidden" {...register('userId')} />
                  <div className="space-y-2">
                    <Label htmlFor="legalEntityId">Legal entity</Label>
                    <Select id="legalEntityId" placeholder="Select"
                      options={(legalEntities?.data ?? []).map((l) => ({ label: l.name, value: l.id }))}
                      {...register('legalEntityId')} />
                    {errors.legalEntityId && <p className="text-xs text-destructive">{errors.legalEntityId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleId">Role</Label>
                    <Select id="roleId" placeholder="Select"
                      options={(roles ?? []).map((r) => ({ label: `${r.name} (${r.code})`, value: r.id }))}
                      {...register('roleId')} />
                    {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
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
                <TableHead>Legal entity</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Effective to</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : assignments && assignments.length > 0 ? assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.legalEntity?.name ?? '—'}</TableCell>
                  <TableCell>{a.role?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(a.effectiveFrom).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={a.isActive ? 'text-green-600' : 'text-muted-foreground'}>
                      {a.isActive ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No assignments.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Revoke assignment?"
        description="The user immediately loses this role within this entity."
        loading={revokeMut.isPending}
        onConfirm={() => deleting && revokeMut.mutate(deleting.id)}
      />
    </div>
  );
}
