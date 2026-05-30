'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Layers,
  Building2,
  Globe,
  Clock,
  CheckCircle2,
  Send,
  FilePen,
  BadgeCheck,
  Wallet,
  Users2,
  ArrowRight,
  Hourglass,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type {
  Paginated,
  Group,
  LegalEntity,
  Country,
  PaymentRequest,
  BankAccount,
} from '@/types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useCount<T>(path: string, enabled = true): number | null {
  const { data } = useQuery({
    queryKey: ['count', path],
    queryFn: () => api.get<Paginated<T>>(`${path}?page=1&limit=1`),
    enabled,
  });
  return data?.total ?? null;
}

function usePrCount(status: string, enabled = true): number | null {
  const { data } = useQuery({
    queryKey: ['pr-count', status],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(`/payment-requests?status=${status}&page=1&limit=1`),
    enabled,
  });
  return data?.total ?? null;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${time}, ${name.split(' ')[0]}`;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  APPROVER: 'Approver',
  FINANCE_HEAD: 'Finance Head',
  INITIATOR: 'Payments Initiator',
  PAYMENTS_MAKER: 'Payments Maker',
  PAYMENTS_CHECKER: 'Payments Checker',
};

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  APPROVER: 'bg-blue-100 text-blue-800',
  FINANCE_HEAD: 'bg-green-100 text-green-800',
  INITIATOR: 'bg-amber-100 text-amber-800',
  PAYMENTS_MAKER: 'bg-orange-100 text-orange-800',
  PAYMENTS_CHECKER: 'bg-teal-100 text-teal-800',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  icon: Icon,
  highlight = false,
  href,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
          {value ?? '—'}
        </p>
      </CardContent>
    </Card>
  );
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

function PrRow({ pr }: { pr: PaymentRequest }) {
  return (
    <li className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{pr.requestNumber}</p>
        <p className="text-xs text-muted-foreground">
          {pr.paymentType?.code ?? '—'} · {pr.currency?.code ?? '—'}{' '}
          {Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          {pr.legalEntity && ` · ${pr.legalEntity.name}`}
        </p>
      </div>
      <Link href={`/payment-requests/${pr.id}`}>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          View <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Role-specific sections
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const groups = useCount<Group>('/groups');
  const legalEntities = useCount<LegalEntity>('/legal-entities');
  const countries = useCount<Country>('/countries');

  const draft = usePrCount('DRAFT');
  const pendingApproval = usePrCount('PENDING_APPROVAL');
  const approved = usePrCount('APPROVED');
  const awaitingPayment = usePrCount('AWAITING_PAYMENT_CONFIRMATION');
  const paid = usePrCount('PAID');

  const { data: pendingList } = useQuery({
    queryKey: ['dashboard-pending-approvals'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=PENDING_APPROVAL&page=1&limit=5',
      ),
  });

  const bankAccountCount = useCount<BankAccount>('/bank-accounts');

  return (
    <div className="space-y-8">
      {/* Payment Stats */}
      <div className="space-y-3">
        <SectionHeading>Payment Requests</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Drafts" value={draft} icon={FilePen} href="/payment-requests?status=DRAFT" />
          <StatTile label="Pending Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="Approved" value={approved} icon={CheckCircle2} href="/payment-requests?status=APPROVED" />
          <StatTile label="Awaiting Payment" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=AWAITING_PAYMENT_CONFIRMATION" />
          <StatTile label="Paid" value={paid} icon={BadgeCheck} href="/payment-requests?status=PAID" />
        </div>
      </div>

      {/* Org Overview */}
      <div className="space-y-3">
        <SectionHeading>Organisation Overview</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Groups" value={groups} icon={Layers} href="/groups" />
          <StatTile label="Legal Entities" value={legalEntities} icon={Building2} href="/legal-entities" />
          <StatTile label="Countries" value={countries} icon={Globe} href="/countries" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="space-y-3">
        <SectionHeading>System</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Bank Accounts" value={bankAccountCount} icon={Wallet} href="/bank-accounts" />
        </div>
      </div>

      {/* Recent pending approvals */}
      {pendingList && pendingList.data.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading>Requests Pending Approval</SectionHeading>
            <Link href="/payment-requests?status=PENDING_APPROVAL">
              <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
            </Link>
          </div>
          <Card className="p-4">
            <ul>
              {pendingList.data.map((pr) => (
                <PrRow key={pr.id} pr={pr} />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function ApproverDashboard() {
  const pendingApproval = usePrCount('PENDING_APPROVAL');
  const approved = usePrCount('APPROVED');
  const paid = usePrCount('PAID');

  const { data: pendingList } = useQuery({
    queryKey: ['dashboard-pending-approvals'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=PENDING_APPROVAL&page=1&limit=8',
      ),
  });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>Payment Overview</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Awaiting My Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="Approved (Total)" value={approved} icon={CheckCircle2} href="/payment-requests?status=APPROVED" />
          <StatTile label="Paid (Total)" value={paid} icon={BadgeCheck} href="/payment-requests?status=PAID" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Requests Pending Your Approval</SectionHeading>
          <Link href="/payment-requests?status=PENDING_APPROVAL">
            <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
          </Link>
        </div>
        {pendingList && pendingList.data.length > 0 ? (
          <Card className="p-4">
            <ul>
              {pendingList.data.map((pr) => (
                <PrRow key={pr.id} pr={pr} />
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No payment requests are currently pending approval.
          </Card>
        )}
      </div>
    </div>
  );
}

function FinanceHeadDashboard() {
  const draft = usePrCount('DRAFT');
  const pendingApproval = usePrCount('PENDING_APPROVAL');
  const approved = usePrCount('APPROVED');
  const awaitingPayment = usePrCount('AWAITING_PAYMENT_CONFIRMATION');
  const paid = usePrCount('PAID');
  const bankAccounts = useCount<BankAccount>('/bank-accounts');

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>Payment Requests</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Drafts" value={draft} icon={FilePen} href="/payment-requests?status=DRAFT" />
          <StatTile label="Pending Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="Approved" value={approved} icon={CheckCircle2} href="/payment-requests?status=APPROVED" />
          <StatTile label="Awaiting Payment" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=AWAITING_PAYMENT_CONFIRMATION" />
          <StatTile label="Paid" value={paid} icon={BadgeCheck} href="/payment-requests?status=PAID" />
        </div>
      </div>
      <div className="space-y-3">
        <SectionHeading>Banking</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Bank Accounts" value={bankAccounts} icon={Wallet} href="/bank-accounts" />
        </div>
      </div>
    </div>
  );
}

function InitiatorDashboard() {
  const draft = usePrCount('DRAFT');
  const pendingApproval = usePrCount('PENDING_APPROVAL');
  const approved = usePrCount('APPROVED');
  const paid = usePrCount('PAID');

  const { data: myDrafts } = useQuery({
    queryKey: ['dashboard-my-drafts'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=DRAFT&page=1&limit=5',
      ),
  });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>My Payment Requests</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Drafts" value={draft} icon={FilePen} highlight href="/payment-requests?status=DRAFT" />
          <StatTile label="Pending Approval" value={pendingApproval} icon={Clock} href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="Approved" value={approved} icon={CheckCircle2} href="/payment-requests?status=APPROVED" />
          <StatTile label="Paid" value={paid} icon={BadgeCheck} href="/payment-requests?status=PAID" />
        </div>
      </div>

      {myDrafts && myDrafts.data.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading>Draft Requests (Action Needed)</SectionHeading>
            <Link href="/payment-requests?status=DRAFT">
              <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
            </Link>
          </div>
          <Card className="p-4">
            <ul>
              {myDrafts.data.map((pr) => (
                <PrRow key={pr.id} pr={pr} />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function MakerCheckerDashboard({ role }: { role: 'PAYMENTS_MAKER' | 'PAYMENTS_CHECKER' }) {
  const approved = usePrCount('APPROVED');
  const awaitingPayment = usePrCount('AWAITING_PAYMENT_CONFIRMATION');
  const paid = usePrCount('PAID');

  const { data: readyList } = useQuery({
    queryKey: ['dashboard-ready-to-release'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=APPROVED&page=1&limit=8',
      ),
  });

  const ismaker = role === 'PAYMENTS_MAKER';

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>Payment Operations</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label={ismaker ? 'Ready to Release' : 'Approved (Pending Release)'}
            value={approved}
            icon={Send}
            highlight
            href="/payment-requests?status=APPROVED"
          />
          <StatTile label="Awaiting Confirmation" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=AWAITING_PAYMENT_CONFIRMATION" />
          <StatTile label="Total Paid" value={paid} icon={BadgeCheck} href="/payment-requests?status=PAID" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>
            {ismaker ? 'Approved Payments Ready to Release' : 'Approved Payments to Verify'}
          </SectionHeading>
          <Link href="/payment-requests?status=APPROVED">
            <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
          </Link>
        </div>
        {readyList && readyList.data.length > 0 ? (
          <Card className="p-4">
            <ul>
              {readyList.data.map((pr) => (
                <PrRow key={pr.id} pr={pr} />
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No approved payments are currently waiting for release.
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const roles: string[] = user?.roles ?? [];

  const has = (r: string) => roles.includes(r);

  // Determine which dashboard to render (in priority order).
  const isAdmin = has('SUPER_ADMIN');
  const isApprover = has('APPROVER');
  const isFinanceHead = has('FINANCE_HEAD');
  const isInitiator = has('INITIATOR');
  const isMaker = has('PAYMENTS_MAKER');
  const isChecker = has('PAYMENTS_CHECKER');

  // Deduplicated role labels for the badge strip (skip SUPER_ADMIN duplicates for platform admins).
  const displayRoles = roles.filter(
    (r, i, arr) => arr.indexOf(r) === i && ROLE_LABEL[r],
  );

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {user ? greeting(user.fullName) : 'Welcome'}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayRoles.map((r) => (
              <span
                key={r}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[r] ?? 'bg-muted text-muted-foreground'}`}
              >
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {isAdmin && <AdminDashboard />}
      {!isAdmin && isApprover && <ApproverDashboard />}
      {!isAdmin && isFinanceHead && <FinanceHeadDashboard />}
      {!isAdmin && isInitiator && !isFinanceHead && !isApprover && <InitiatorDashboard />}
      {!isAdmin && (isMaker || isChecker) && !isFinanceHead && !isApprover && (
        <MakerCheckerDashboard role={isMaker ? 'PAYMENTS_MAKER' : 'PAYMENTS_CHECKER'} />
      )}

      {/* Fallback for users with no specific dashboard content */}
      {!isAdmin && !isApprover && !isFinanceHead && !isInitiator && !isMaker && !isChecker && (
        <Card className="p-8 text-center">
          <Users2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No role-specific content available. Contact your administrator to assign the correct
            roles to your account.
          </p>
        </Card>
      )}
    </div>
  );
}
