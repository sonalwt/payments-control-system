'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated, Group, LegalEntity, Country, BusinessUnit, Department } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers, Building2, Globe, Briefcase, Network } from 'lucide-react';

function useCount<T>(path: string): number | null {
  const { data } = useQuery({
    queryKey: ['count', path],
    queryFn: () => api.get<Paginated<T>>(`${path}?page=1&limit=1`),
  });
  return data?.total ?? null;
}

export default function DashboardPage(): React.ReactElement {
  const groups = useCount<Group>('/groups');
  const legalEntities = useCount<LegalEntity>('/legal-entities');
  const countries = useCount<Country>('/countries');
  const businessUnits = useCount<BusinessUnit>('/business-units');
  const departments = useCount<Department>('/departments');

  const tiles = [
    { label: 'Groups', value: groups, icon: Layers },
    { label: 'Legal Entities', value: legalEntities, icon: Building2 },
    { label: 'Countries', value: countries, icon: Globe },
    { label: 'Business Units', value: businessUnits, icon: Briefcase },
    { label: 'Departments', value: departments, icon: Network },
  ];

  return (
    <div>
      <PageHeader
        title="Organisation overview"
        description="Section 1.1 — Entities and Organisational Structure"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value ?? '—'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
