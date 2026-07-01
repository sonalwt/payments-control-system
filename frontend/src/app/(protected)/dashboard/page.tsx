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
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { hourInDubai } from '@/lib/datetime';
import { useAuth } from '@/hooks/use-auth';
import { usePrMessageSummary, type PrMessageInfo } from '@/hooks/use-pr-message-summary';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const h = hourInDubai();
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

function MsgBadge({ info }: { info: PrMessageInfo | null }) {
  if (!info) return null;
  return (
    <span
      title={`${info.count} chat message${info.count !== 1 ? 's' : ''}${info.isNew ? ' — new' : ''}`}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
        info.isNew
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      <MessageCircle className="h-2.5 w-2.5" />
      {info.isNew ? 'NEW' : info.count}
    </span>
  );
}

function PrRow({ pr, msgInfo }: { pr: PaymentRequest; msgInfo?: PrMessageInfo | null }) {
  return (
    <li className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center gap-1.5">
          {pr.requestNumber}
          <MsgBadge info={msgInfo ?? null} />
        </p>
        <p className="text-xs text-muted-foreground">
          {pr.paymentType?.code ?? '—'} · {pr.currency?.code ?? '—'}{' '}
          {Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          {pr.paymentType?.legalEntity && ` · ${pr.paymentType.legalEntity.name}`}
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

// What the viewer needs to do, by the request's current status.
const ACTION_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Awaiting your approval',
  TREASURY_MAKER: 'Select account + upload Online TT',
  TREASURY_CHECKER: 'Awaiting your check',
  TREASURY_AUTHORISER: 'Awaiting your authorisation',
  TREASURY_SWIFT: 'Upload SWIFT copy + reference',
  AWAITING_CLOSURE: 'Close the payment request',
  UNDER_INVESTIGATION: 'Investigate reopened payment',
};

/**
 * "Needs your attention" — requests awaiting THIS user's action right now
 * (their active approval step, or a treasury stage they own). Backed by the
 * `awaitingAction=true` list filter, so it works for approvers and for every
 * treasury role. Renders nothing when the queue is empty.
 */
function NeedsAttention(): React.ReactElement | null {
  const { data } = useQuery({
    queryKey: ['pr-awaiting-action'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?awaitingAction=true&page=1&limit=8',
      ),
  });
  const getMsgInfo = usePrMessageSummary();
  const rows = data?.data ?? [];
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeading>Needs your attention</SectionHeading>
        <Link href="/payment-requests">
          <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
        </Link>
      </div>
      <Card className="border-amber-300 bg-amber-50/40 p-4">
        <ul>
          {rows.map((pr) => (
            <li key={pr.id} className="flex items-center gap-3 border-b py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium flex items-center gap-1.5">
                  {pr.requestNumber}
                  <MsgBadge info={getMsgInfo(pr.id)} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {pr.paymentType?.code ?? '—'} · {pr.currency?.code ?? '—'}{' '}
                  {Number(pr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 sm:inline">
                {ACTION_LABEL[pr.status] ?? pr.status.replace(/_/g, ' ')}
              </span>
              <Link href={`/payment-requests/${pr.id}`}>
                <Button size="sm" className="h-7 gap-1 text-xs">
                  Action <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/**
 * Admin alert: group-own bank accounts whose remaining balance has dropped
 * below their configured minimum balance. Shown as a compact "Urgent attention"
 * banner; clicking it opens a popup with the breaching accounts. Renders nothing
 * when all accounts are healthy. Admin-only (the endpoint requires SUPER_ADMIN).
 */
function LowBalanceAlert(): React.ReactElement | null {
  const { data } = useQuery({
    queryKey: ['bank-accounts-below-minimum'],
    queryFn: () => api.get<BankAccount[]>('/bank-accounts/below-minimum'),
  });
  const rows = data ?? [];
  if (rows.length === 0) return null;
  const money = (n: number | string): string =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-red-800">Urgent attention</span>
            <span className="block text-xs text-red-700">
              {rows.length} bank account{rows.length > 1 ? 's are' : ' is'} below minimum balance — click to review
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {rows.length}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Accounts below minimum balance
          </DialogTitle>
        </DialogHeader>
        <ul className="max-h-[60vh] divide-y overflow-y-auto">
          {rows.map((a) => {
            const ccy = a.currency?.code ? `${a.currency.code} ` : '';
            const bank = a.bankNickname ?? a.bankName ?? 'Account';
            const shortfall = Number(a.minimumBalance) - Number(a.remainingBalance);
            return (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bank} · {a.accountNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Balance {ccy}{money(a.remainingBalance)} · minimum {ccy}{money(a.minimumBalance)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  short {ccy}{money(shortfall)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end">
          <Link href="/bank-accounts">
            <Button size="sm" variant="outline">Go to Bank Accounts</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
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
  const approved = usePrCount('TREASURY_MAKER');
  const awaitingPayment = usePrCount('TREASURY_CHECKER');
  const paid = usePrCount('COMPLETED');

  const { data: pendingList } = useQuery({
    queryKey: ['dashboard-pending-approvals'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=PENDING_APPROVAL&page=1&limit=5',
      ),
  });

  const getMsgInfo = usePrMessageSummary();
  const bankAccountCount = useCount<BankAccount>('/bank-accounts');

  return (
    <div className="space-y-8">
      {/* Low-balance admin alert */}
      <LowBalanceAlert />

      {/* Payment Stats */}
      <div className="space-y-3">
        <SectionHeading>Payment Requests</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Drafts" value={draft} icon={FilePen} href="/payment-requests?status=DRAFT" />
          <StatTile label="Pending Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="In Treasury" value={approved} icon={CheckCircle2} href="/payment-requests?status=TREASURY_MAKER" />
          <StatTile label="Treasury — Checking" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=TREASURY_CHECKER" />
          <StatTile label="Completed" value={paid} icon={BadgeCheck} href="/payment-requests?status=COMPLETED" />
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
                <PrRow key={pr.id} pr={pr} msgInfo={getMsgInfo(pr.id)} />
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
  const approved = usePrCount('TREASURY_MAKER');
  const paid = usePrCount('COMPLETED');

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>Payment Overview</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Awaiting My Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="In Treasury (Total)" value={approved} icon={CheckCircle2} href="/payment-requests?status=TREASURY_MAKER" />
          <StatTile label="Completed (Total)" value={paid} icon={BadgeCheck} href="/payment-requests?status=COMPLETED" />
        </div>
      </div>
    </div>
  );
}

function FinanceHeadDashboard() {
  const draft = usePrCount('DRAFT');
  const pendingApproval = usePrCount('PENDING_APPROVAL');
  const approved = usePrCount('TREASURY_MAKER');
  const awaitingPayment = usePrCount('TREASURY_CHECKER');
  const paid = usePrCount('COMPLETED');
  const bankAccounts = useCount<BankAccount>('/bank-accounts');

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionHeading>Payment Requests</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Drafts" value={draft} icon={FilePen} href="/payment-requests?status=DRAFT" />
          <StatTile label="Pending Approval" value={pendingApproval} icon={Clock} highlight href="/payment-requests?status=PENDING_APPROVAL" />
          <StatTile label="In Treasury" value={approved} icon={CheckCircle2} href="/payment-requests?status=TREASURY_MAKER" />
          <StatTile label="Treasury — Checking" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=TREASURY_CHECKER" />
          <StatTile label="Completed" value={paid} icon={BadgeCheck} href="/payment-requests?status=COMPLETED" />
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
  const approved = usePrCount('TREASURY_MAKER');
  const paid = usePrCount('COMPLETED');
  const getMsgInfo = usePrMessageSummary();

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
          <StatTile label="In Treasury" value={approved} icon={CheckCircle2} href="/payment-requests?status=TREASURY_MAKER" />
          <StatTile label="Completed" value={paid} icon={BadgeCheck} href="/payment-requests?status=COMPLETED" />
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
                <PrRow key={pr.id} pr={pr} msgInfo={getMsgInfo(pr.id)} />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function MakerCheckerDashboard({ role }: { role: 'PAYMENTS_MAKER' | 'PAYMENTS_CHECKER' }) {
  const approved = usePrCount('TREASURY_MAKER');
  const awaitingPayment = usePrCount('TREASURY_CHECKER');
  const paid = usePrCount('COMPLETED');
  const getMsgInfo = usePrMessageSummary();

  const { data: readyList } = useQuery({
    queryKey: ['dashboard-ready-to-release'],
    queryFn: () =>
      api.get<Paginated<PaymentRequest>>(
        '/payment-requests?status=TREASURY_MAKER&page=1&limit=8',
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
            href="/payment-requests?status=TREASURY_MAKER"
          />
          <StatTile label="Treasury — Checking" value={awaitingPayment} icon={Hourglass} href="/payment-requests?status=TREASURY_CHECKER" />
          <StatTile label="Total Completed" value={paid} icon={BadgeCheck} href="/payment-requests?status=COMPLETED" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>
            {ismaker ? 'Approved Payments Ready to Release' : 'Approved Payments to Verify'}
          </SectionHeading>
          <Link href="/payment-requests?status=TREASURY_MAKER">
            <Button variant="ghost" size="sm" className="h-6 text-xs">View all</Button>
          </Link>
        </div>
        {readyList && readyList.data.length > 0 ? (
          <Card className="p-4">
            <ul>
              {readyList.data.map((pr) => (
                <PrRow key={pr.id} pr={pr} msgInfo={getMsgInfo(pr.id)} />
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

      {/* Requests awaiting this user's action (approval step or treasury stage) */}
      <NeedsAttention />

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
