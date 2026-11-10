import { RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InsightSections } from '@/features/ai/InsightSections';
import { insightsApi, type InsightsPeriod } from '@/features/ai/insightsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { InsightStats, MaintenanceInsightsResponse } from '@/types/insights';

function formatDateTime(value: string): string {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/70 bg-card px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatsGrid({
  stats,
  scope = 'maintenance',
}: {
  stats: InsightStats;
  scope?: 'maintenance' | 'admin';
}) {
  const { t } = useTranslation();

  if (scope === 'admin' && stats.users && stats.maintenance && stats.lostFound) {
    const { users, maintenance, lostFound } = stats;
    const duePlansCount = maintenance.duePreventivePlans?.length ?? 0;

    return (
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('ai.systemStats')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <StatBlock
            label={t('ai.activeAccounts')}
            value={`${users.active} / ${users.total}`}
          />
          <StatBlock
            label={t('ai.openBacklog')}
            value={`${maintenance.openBacklog} (${maintenance.requestsInPeriod})`}
          />
          <StatBlock
            label={t('ai.overdueWorkOrders')}
            value={`${maintenance.overdueWorkOrders} · ${duePlansCount} ${t('ai.duePreventivePlans')}`}
          />
          <StatBlock
            label={t('ai.openLostFound')}
            value={lostFound.openLostItems + lostFound.openFoundItems}
          />
          <StatBlock
            label={t('ai.pendingMatchesClaims')}
            value={`${lostFound.pendingMatchesCount} / ${lostFound.pendingClaimsCount + lostFound.claimsAwaitingHandover}`}
          />
        </div>
      </div>
    );
  }

  const requests = stats.requests;
  const workOrders = stats.workOrders;
  const change = requests?.changePercent;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t('ai.systemStats')}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatBlock label={t('dashboard.requests')} value={requests?.total ?? '—'} />
        <StatBlock
          label={t('ai.changeVsPrevious')}
          value={change === undefined ? '—' : `${change > 0 ? '+' : ''}${change}%`}
        />
        <StatBlock label={t('ai.openBacklog')} value={requests?.openBacklog ?? '—'} />
        <StatBlock label={t('ai.activeWorkOrders')} value={workOrders?.active ?? '—'} />
        <StatBlock label={t('ai.overdueWorkOrders')} value={workOrders?.overdue ?? '—'} />
      </div>
    </div>
  );
}

function AdminOperationalSnapshot({ stats }: { stats: InsightStats }) {
  const { t } = useTranslation();
  const claims = stats.lostFound?.activeClaims ?? [];
  const matches = stats.lostFound?.suggestedMatches ?? [];
  const overdueWOs = stats.maintenance?.overdueDetails ?? [];
  const duePlans = stats.maintenance?.duePreventivePlans ?? [];
  const roster = stats.users?.technicianRoster ?? [];

  if (
    claims.length === 0 &&
    matches.length === 0 &&
    overdueWOs.length === 0 &&
    duePlans.length === 0 &&
    roster.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t('ai.platformHighlights')}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border/70 bg-muted/15 p-3">
          <p className="text-xs font-semibold text-foreground">
            {t('ai.overdueAndPreventiveWatch')}
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {overdueWOs.slice(0, 3).map((wo) => (
              <li key={wo.code} className="truncate">
                <span className="font-medium text-foreground" dir="ltr">
                  {wo.code}
                </span>{' '}
                · {wo.title} · {wo.technician} ({wo.location})
              </li>
            ))}
            {duePlans.slice(0, 2).map((plan) => (
              <li key={plan.title} className="truncate">
                <span className="font-medium text-foreground">{plan.title}</span> ·{' '}
                {plan.technician} ({plan.location})
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border/70 bg-muted/15 p-3">
          <p className="text-xs font-semibold text-foreground">
            {t('ai.activeClaimsWatch')} & {t('ai.suggestedMatchesWatch')}
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {claims.slice(0, 3).map((claim) => (
              <li key={claim.code} className="truncate">
                <span className="font-medium text-foreground" dir="ltr">
                  {claim.code}
                </span>{' '}
                · {claim.itemTitle} · {claim.claimant} ({claim.status})
              </li>
            ))}
            {matches.slice(0, 2).map((match, idx) => (
              <li key={`${match.lostCode ?? idx}-${match.foundCode ?? idx}`} className="truncate">
                <span className="font-medium text-foreground" dir="ltr">
                  {match.lostCode} ↔ {match.foundCode}
                </span>{' '}
                · {match.lostTitle} ({match.score}%)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  defaultPeriod?: InsightsPeriod;
  scope?: 'maintenance' | 'admin';
}

export function InsightsPanel({
  defaultPeriod = '7d',
  scope = 'maintenance',
}: InsightsPanelProps) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<InsightsPeriod>(defaultPeriod);
  const queryClient = useQueryClient();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const queryKey = [
    scope === 'admin' ? 'admin-insights' : 'maintenance-insights',
    period,
    lang,
  ] as const;
  const runGenerate =
    scope === 'admin' ? insightsApi.generateAdmin : insightsApi.generate;

  const periods: Array<{ value: InsightsPeriod; label: string }> = [
    { value: '7d', label: t('dashboard.period7d') },
    { value: '30d', label: t('dashboard.period30d') },
  ];

  const insightsQuery = useQuery({
    queryKey,
    queryFn: () => runGenerate({ period }),
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: () => runGenerate({ period, regenerate: true }),
    onSuccess: (data: MaintenanceInsightsResponse) => {
      queryClient.setQueryData(queryKey, data);
      if (data.available) {
        toast.success(t('ai.insights'));
      } else {
        toast.info(data.message ?? t('ai.unavailable'));
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const data = insightsQuery.data;
  const errorMessage = insightsQuery.error ? getErrorMessage(insightsQuery.error) : null;

  return (
    <Card>
      <CardHeader className="gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {scope === 'admin' ? t('ai.adminInsightsTitle') : t('ai.insightsTitle')}
          </CardTitle>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {scope === 'admin'
              ? t('ai.adminStatsCalculatedNotice')
              : t('ai.statsCalculatedNotice')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="insights-period" className="sr-only">
            {t('dashboard.period')}
          </label>
          <select
            id="insights-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value as InsightsPeriod)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {periods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending || insightsQuery.isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {t('ai.regenerate')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {insightsQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label={t('common.loading')}>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : errorMessage ? (
          <ErrorState
            title={t('errors.generic')}
            message={errorMessage}
            onRetry={() => void insightsQuery.refetch()}
            className="min-h-[180px]"
          />
        ) : data ? (
          <>
            <StatsGrid stats={data.stats} scope={scope} />
            {scope === 'admin' ? <AdminOperationalSnapshot stats={data.stats} /> : null}

            {!data.available ? (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3.5 py-3 text-sm text-amber-950"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t('ai.analysisUnavailable')}</p>
                  <p className="mt-0.5 text-amber-900/80">
                    {data.message ?? t('ai.unavailable')}
                  </p>
                </div>
              </div>
            ) : null}

            {data.insights ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {data.available ? t('ai.insights') : t('ai.lastCachedInsight')}
                  </p>
                  {data.generatedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(data.generatedAt)} ·{' '}
                      {formatDate(data.rangeStart)} – {formatDate(data.rangeEnd)}
                    </p>
                  ) : null}
                </div>
                <InsightSections insights={data.insights} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('ai.noCachedInsight')}
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
