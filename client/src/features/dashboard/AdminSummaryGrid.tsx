import { PackageSearch, Shield, Wrench, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn, formatNumber } from '@/lib/utils';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

interface AdminSummaryGridProps {
  totals: AdminDashboardData['totals'];
}

type DomainAccent = 'navy' | 'emerald' | 'gold';

interface DomainMetricPair {
  label: string;
  value: number;
  sub: string;
}

interface DomainActionLink {
  label: string;
  to: string;
}

interface DomainMonitorItem {
  key: string;
  title: string;
  icon: LucideIcon;
  accent: DomainAccent;
  statusBadge: string;
  statusTone: 'emerald' | 'navy' | 'gold' | 'muted';
  metrics: [DomainMetricPair, DomainMetricPair];
  actions: [DomainActionLink, DomainActionLink];
}

const TOP_BAR_BY_ACCENT: Record<DomainAccent, string> = {
  navy: 'bg-primary',
  emerald: 'bg-emerald-600',
  gold: 'bg-[hsl(var(--mnu-gold))]',
};

const ICON_CHIP_BY_ACCENT: Record<DomainAccent, string> = {
  navy: 'bg-primary/[0.08] text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-700',
  gold: 'bg-amber-500/[0.12] text-amber-800',
};

const STATUS_PILL_STYLES: Record<DomainMonitorItem['statusTone'], string> = {
  emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  navy: 'border-primary/20 bg-primary/[0.08] text-primary',
  gold: 'border-amber-500/30 bg-amber-500/[0.12] text-amber-800',
  muted: 'border-border bg-secondary/60 text-muted-foreground',
};

function DomainMonitorCard({ domain }: { domain: DomainMonitorItem }) {
  const Icon = domain.icon;

  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs">
      <span
        aria-hidden="true"
        className={cn('absolute inset-x-0 top-0 h-[3px]', TOP_BAR_BY_ACCENT[domain.accent])}
      />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                ICON_CHIP_BY_ACCENT[domain.accent],
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 className="truncate text-sm font-semibold text-foreground">{domain.title}</h2>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums',
              STATUS_PILL_STYLES[domain.statusTone],
            )}
          >
            {domain.statusBadge}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-secondary/45 p-3.5">
          {domain.metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
              <p className="mt-1.5 text-2xl font-bold leading-none tracking-[-0.02em] tabular-nums text-foreground">
                {formatNumber(metric.value)}
              </p>
              <p className="mt-1.5 truncate text-xs tabular-nums text-muted-foreground">
                {metric.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-0.5">
        {domain.actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="inline-flex min-h-8 flex-1 items-center justify-center rounded-lg border border-border/80 bg-card px-3 py-1.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

/**
 * Three executive subsystem domain monitors for the Super Admin command board:
 * Identity & Campus Infrastructure, Maintenance Operations Pipeline, and Lost & Found Pipeline.
 */
export function AdminSummaryGrid({ totals }: AdminSummaryGridProps) {
  const { t } = useTranslation();

  const inactiveUsers = Math.max(0, totals.users - totals.activeUsers);
  const activeRatioPct =
    totals.users > 0 ? Math.round((totals.activeUsers / totals.users) * 100) : 0;
  const dispatchRatePct =
    totals.maintenanceRequests > 0
      ? Math.min(100, Math.round((totals.workOrders / totals.maintenanceRequests) * 100))
      : 0;
  const totalLostFound = totals.lostItems + totals.foundItems;
  const pendingTriage = totals.pendingMatches + totals.pendingClaims;

  const domains: DomainMonitorItem[] = [
    {
      key: 'identity-infrastructure',
      title: t('dashboard.adminDomainIdentityTitle'),
      icon: Shield,
      accent: 'navy',
      statusBadge: t('dashboard.adminActiveRatioPill', {
        pct: formatNumber(activeRatioPct),
      }),
      statusTone: totals.activeUsers > 0 ? 'emerald' : 'muted',
      metrics: [
        {
          label: t('dashboard.adminTotalUsersLabel'),
          value: totals.users,
          sub: t('dashboard.adminUsersActiveInactiveHint', {
            active: formatNumber(totals.activeUsers),
            inactive: formatNumber(inactiveUsers),
          }),
        },
        {
          label: t('dashboard.adminCampusFacilitiesLabel'),
          value: totals.locations,
          sub: t('dashboard.adminAcrossBuildingsHint', {
            buildings: formatNumber(totals.buildings),
          }),
        },
      ],
      actions: [
        { label: t('dashboard.manageUsers'), to: '/users' },
        { label: t('dashboard.adminLocationsAction'), to: '/locations' },
      ],
    },
    {
      key: 'maintenance-pipeline',
      title: t('dashboard.adminDomainMaintenanceTitle'),
      icon: Wrench,
      accent: 'emerald',
      statusBadge: t('dashboard.adminDispatchRatePill', {
        rate: formatNumber(dispatchRatePct),
      }),
      statusTone: 'navy',
      metrics: [
        {
          label: t('dashboard.adminTotalRequestsLabel'),
          value: totals.maintenanceRequests,
          sub: t('dashboard.adminDispatchRatePill', {
            rate: formatNumber(dispatchRatePct),
          }),
        },
        {
          label: t('dashboard.adminWorkOrdersIssuedLabel'),
          value: totals.workOrders,
          sub: t('dashboard.adminFieldTechniciansHint', {
            count: formatNumber(totals.technicians),
          }),
        },
      ],
      actions: [
        { label: t('dashboard.adminViewRequestsAction'), to: '/maintenance/requests' },
        { label: t('nav.workOrders'), to: '/work-orders' },
      ],
    },
    {
      key: 'lost-found-pipeline',
      title: t('dashboard.adminDomainLostFoundTitle'),
      icon: PackageSearch,
      accent: 'gold',
      statusBadge:
        pendingTriage > 0
          ? t('dashboard.adminPendingTriagePill', {
              count: formatNumber(pendingTriage),
            })
          : t('dashboard.adminAllCaughtUpPill'),
      statusTone: pendingTriage > 0 ? 'gold' : 'emerald',
      metrics: [
        {
          label: t('dashboard.adminLostFoundItemsLabel'),
          value: totalLostFound,
          sub: t('dashboard.adminLostFoundSplitHint', {
            lost: formatNumber(totals.lostItems),
            found: formatNumber(totals.foundItems),
          }),
        },
        {
          label: t('dashboard.adminMatchesClaimsLabel'),
          value: pendingTriage,
          sub: t('dashboard.adminMatchesClaimsSplitHint', {
            matches: formatNumber(totals.pendingMatches),
            claims: formatNumber(totals.pendingClaims),
          }),
        },
      ],
      actions: [
        { label: t('nav.allReports'), to: '/lost-found/items' },
        { label: t('nav.archivedItems'), to: '/lost-found/archived' },
      ],
    },
  ];

  return (
    <section aria-label={t('nav.groupOverview')} className="grid gap-5 lg:grid-cols-3">
      {domains.map((domain) => (
        <DomainMonitorCard key={domain.key} domain={domain} />
      ))}
    </section>
  );
}
