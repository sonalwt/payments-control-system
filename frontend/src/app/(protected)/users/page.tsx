'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { Paginated, User } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { Button } from '@/components/ui/button';

export default function UsersPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = useMemo(() => {
    const u = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) u.set('search', search);
    return u.toString();
  }, [page, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get<Paginated<User>>(`/users?${params}`),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Application users; manage their entity-role assignments under User Role Assignment"
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
              <TableHead>Last login</TableHead>
              <TableHead className="w-40 text-right">Assignments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : data && data.data.length > 0 ? data.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.employeeCode ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/user-roles?userId=${u.id}`}>Manage roles</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No users yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && <DataTablePagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
