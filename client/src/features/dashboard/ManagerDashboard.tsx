import {
  Building2,
  ClipboardList,
  MessageSquare,
  Star,
  Timer,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { ManagerCharts } from '@/features/dashboard/ManagerCharts';
import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ManagerDashboard as ManagerDashboardData } from '@/types/dashboard';

export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  const { t } = useTranslation();
  const { metrics } = data;
  const maxFeedback = Math.max(...metrics.feedback.distribution.map((entry) => entry.count), 1);
  const topBuildings = metrics.requestsByBuilding.slice(0, 5);

  const formatHours = (value: number | null): string => {
    return value === null ? '—' : t('dashboard.hoursShort', { hours: value.toFixed(1) });
  };

  const formatRating = (value: number | null): string => {
    return value === null ? '—' : value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label={t('dashboard.requests')}
          value={metrics.totalRequests}
          icon={ClipboardList}
          hint={t('dashboard.period')}
        />
        <DashboardStatCard
          label={t('dashboard.activeWorkOrders')}
          value={metrics.activeWorkOrders}
          icon={Wrench}
          hint={t('workOrders.title')}
        />
        <DashboardStatCard
          label={t('dashboard.overdue')}
          value={metrics.overdueWorkOrders}
          icon={TriangleAlert}
          tone={metrics.overdueWorkOrders > 0 ? 'danger' : 'success'}
          hint={t('common.overdue')}
        />
        <DashboardStatCard
          label={t('dashboard.avgResolution')}
          value={formatHours(metrics.averageResolutionHours)}
          icon={Timer}
          hint={t('technicians.avgResolutionHours')}
        />
        <DashboardStatCard
          label={t('dashboard.feedbackRating')}
          value={formatRating(metrics.feedback.averageRating)}
          icon={Star}
          tone="warning"
          hint={`${metrics.feedback.total} ${t('feedback.totalReviews')}`}
        />
      </div>

      <ManagerCharts metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.requestsByBuilding')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.requestsByBuildingDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {topBuildings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noRequestsInPeriod')}</p>
            ) : (
              topBuildings.map((entry) => {
                const percent = Math.round((entry.count / Math.max(metrics.totalRequests, 1)) * 100);
                return (
                  <div key={entry.building} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{entry.building}</span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {entry.count} · {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.feedbackDistribution')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.feedbackDistributionDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {[...metrics.feedback.distribution].reverse().map((entry) => (
              <div key={entry.rating} className="flex items-center gap-3">
                <span className="flex w-10 items-center gap-1 text-xs font-medium text-muted-foreground">
                  {entry.rating}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.round((entry.count / maxFeedback) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-end text-xs tabular-nums text-muted-foreground">
                  {entry.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <InsightsPanel />
    </div>
  );
}
