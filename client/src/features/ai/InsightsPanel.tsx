import { RefreshCw, Sparkles, TriangleAlert, X } from 'lucide-react';
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
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { InsightStats, MaintenanceInsightsResponse } from '@/types/insights';

function formatDateTime(value: string): string {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

interface PulseTileProps {
  label: string;
  value: string | number;
  note?: string;
  tone?: 'default' | 'danger' | 'emerald' | 'gold';
}

function PulseTile({ label, value, note, tone = 'default' }: PulseTileProps) {
  const valueColor =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'emerald'
        ? 'text-emerald-700'
        : tone === 'gold'
          ? 'text-amber-800'
          : 'text-foreground';

  return (
    <div className="rounded-lg bg-secondary/45 px-4 py-3">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1.5 text-xl font-bold leading-none tabular-nums', valueColor)}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {note ? (
        <p className="mt-1.5 truncate text-xs tabular-nums text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

function ExecutivePulseStrip({
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
    const pendingTriageCount =
      lostFound.pendingMatchesCount +
      lostFound.pendingClaimsCount +
      lostFound.claimsAwaitingHandover;

    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PulseTile
          label={t('ai.activeAccounts')}
          value={`${formatNumber(users.active)} / ${formatNumber(users.total)}`}
          note={t('dashboard.adminFieldTechniciansHint', {
            count: formatNumber(users.technicians),
          })}
        />
        <PulseTile
          label={t('ai.openBacklog')}
          value={maintenance.openBacklog}
          note={
            maintenance.overdueWorkOrders > 0
              ? t('ai.overdueCountInline', {
                  count: formatNumber(maintenance.overdueWorkOrders),
                })
              : t('ai.allClear')
          }
          tone={maintenance.overdueWorkOrders > 0 ? 'danger' : 'default'}
        />
        <PulseTile
          label={t('ai.duePlansShort')}
          value={duePlansCount}
          note={duePlansCount > 0 ? t('dashboard.pendingReview') : t('ai.onSchedule')}
          tone={duePlansCount > 0 ? 'gold' : 'emerald'}
        />
        <PulseTile
          label={t('ai.pendingMatchesClaims')}
          value={pendingTriageCount}
          note={t('ai.matchesAndClaimsSplit', {
            matches: formatNumber(lostFound.pendingMatchesCount),
            claims: formatNumber(
              lostFound.pendingClaimsCount + lostFound.claimsAwaitingHandover,
            ),
          })}
          tone={pendingTriageCount > 0 ? 'gold' : 'emerald'}
        />
      </div>
    );
  }

  const requests = stats.requests;
  const workOrders = stats.workOrders;
  const change = requests?.changePercent;
  const overdueCount = workOrders?.overdue ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <PulseTile
        label={t('ai.requestsInPeriod')}
        value={requests?.total ?? '—'}
        note={
          change === undefined
            ? undefined
            : `${t('ai.changeVsPrevious')}: ${change > 0 ? '+' : ''}${formatNumber(change)}%`
        }
      />
      <PulseTile label={t('ai.openBacklog')} value={requests?.openBacklog ?? '—'} />
      <PulseTile label={t('ai.activeWorkOrders')} value={workOrders?.active ?? '—'} />
      <PulseTile
        label={t('ai.overdueWorkOrders')}
        value={overdueCount}
        note={overdueCount > 0 ? t('dashboard.managerOverdueHint') : t('ai.allClear')}
        tone={overdueCount > 0 ? 'danger' : 'emerald'}
      />
    </div>
  );
}

interface InsightsPanelProps {
  defaultPeriod?: InsightsPeriod;
  scope?: 'maintenance' | 'admin';
  onClose?: () => void;
}

export function InsightsPanel({
  defaultPeriod = '7d',
  scope = 'maintenance',
  onClose,
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
    <Card className="relative overflow-hidden rounded-xl border-border/80 bg-card shadow-xs">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-[hsl(var(--mnu-gold))]"
      />

      <CardHeader className="gap-4 border-b border-border/75 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/[0.12] text-amber-800">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold tracking-[-0.01em] text-foreground">
              {scope === 'admin' ? t('ai.adminInsightsTitle') : t('ai.insightsTitle')}
            </CardTitle>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {scope === 'admin' ? t('ai.adminBriefSubtitle') : t('ai.briefSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label={t('dashboard.period')}
            className="inline-flex rounded-lg border border-border/80 bg-secondary/50 p-1 text-xs"
          >
            {periods.map((option) => {
              const selected = period === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending || insightsQuery.isLoading}
            className="h-9 gap-1.5 rounded-lg border-border/80 bg-card text-xs font-semibold text-foreground hover:border-amber-500/40 hover:bg-amber-500/[0.08]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{t('ai.regenerate')}</span>
          </Button>

          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t('common.close')}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {insightsQuery.isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label={t('common.loading')}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
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
            <ExecutivePulseStrip stats={data.stats} scope={scope} />

            {!data.available ? (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm text-foreground"
              >
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">{t('ai.analysisUnavailable')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {data.message ?? t('ai.unavailable')}
                  </p>
                </div>
              </div>
            ) : null}

            {data.insights ? (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {data.available ? t('ai.insights') : t('ai.lastCachedInsight')}
                  </p>
                  {data.generatedAt ? (
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(data.generatedAt)} · {formatDate(data.rangeStart)} –{' '}
                      {formatDate(data.rangeEnd)}
                    </p>
                  ) : null}
                </div>
                <InsightSections insights={data.insights} />
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/80 bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
                {t('ai.noCachedInsight')}
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
