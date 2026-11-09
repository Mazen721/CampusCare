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

function StatsGrid({ stats }: { stats: InsightStats }) {
  const { t } = useTranslation();
  const requests = stats.requests;
  const workOrders = stats.workOrders;
  const change = requests?.changePercent;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t('ai.systemStats')}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label={t('dashboard.requests')} value={requests?.total ?? '—'} />
        <StatBlock
          label={t('ai.changeVsPrevious')}
          value={change === undefined ? '—' : `${change > 0 ? '+' : ''}${change}%`}
        />
        <StatBlock label={t('ai.activeWorkOrders')} value={workOrders?.active ?? '—'} />
        <StatBlock label={t('ai.overdueWorkOrders')} value={workOrders?.overdue ?? '—'} />
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  defaultPeriod?: InsightsPeriod;
}

export function InsightsPanel({ defaultPeriod = '7d' }: InsightsPanelProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<InsightsPeriod>(defaultPeriod);
  const queryClient = useQueryClient();

  const periods: Array<{ value: InsightsPeriod; label: string }> = [
    { value: '7d', label: t('dashboard.period7d') },
    { value: '30d', label: t('dashboard.period30d') },
  ];

  const insightsQuery = useQuery({
    queryKey: ['maintenance-insights', period],
    queryFn: () => insightsApi.generate({ period }),
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: () => insightsApi.generate({ period, regenerate: true }),
    onSuccess: (data: MaintenanceInsightsResponse) => {
      queryClient.setQueryData(['maintenance-insights', period], data);
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
            {t('ai.insightsTitle')}
          </CardTitle>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('ai.statsCalculatedNotice')}
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
            <StatsGrid stats={data.stats} />

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
