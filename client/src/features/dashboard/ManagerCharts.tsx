import { Building2, Star } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pickLang, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { cn, formatNumber } from '@/lib/utils';
import { REQUEST_STATUSES } from '@/types/meta';
import type { ManagerMetrics } from '@/types/dashboard';

const MNU_NAVY = 'hsl(var(--primary))';
const MNU_GOLD_INK = 'hsl(var(--mnu-gold-ink))';

const TICK_STYLE = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const CHART_MARGIN = { top: 8, right: 8, left: -12, bottom: 20 };
const TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 10,
  borderColor: 'hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};

function ChartCard({
  title,
  description,
  headerAction,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  description: string;
  headerAction?: ReactNode;
  isEmpty: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex h-full min-w-0 flex-col rounded-xl border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </CardTitle>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="mt-auto pt-2">
        {isEmpty ? (
          <p className="flex h-[250px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <div dir="ltr">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Three-column MNU-calibrated analytics row covering request demand breakdown,
 * technician workload balance, and campus hotspots paired with service ratings.
 */
export function ManagerCharts({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();
  const [breakdownMode, setBreakdownMode] = useState<'status' | 'category'>('status');

  const statusData = REQUEST_STATUSES.map((status) => ({
    status: enumLabel('status', status),
    count: metrics.requestsByStatus[status],
  }));

  const categoryData = metrics.requestsByCategory.slice(0, 6).map((entry) => ({
    category: enumLabel('maintenanceCategory', entry.category),
    count: entry.count,
  }));

  const workloadData = [...metrics.technicianWorkload]
    .sort(
      (a, b) =>
        b.activeWorkOrders + b.completedWorkOrders -
        (a.activeWorkOrders + a.completedWorkOrders),
    )
    .slice(0, 5)
    .map((technician) => {
      const displayName = tr(technician, 'name') || technician.name;
      const firstName =
        displayName
          .replace(/^(?:م\.|د\.|أ\.|Eng\.|Dr\.)\s+/i, '')
          .trim()
          .split(/\s+/)[0] ?? displayName;
      return {
        name: firstName,
        active: technician.activeWorkOrders,
        completed: technician.completedWorkOrders,
      };
    });

  const topBuildings = metrics.requestsByBuilding.slice(0, 5);
  const maxFeedback = Math.max(...metrics.feedback.distribution.map((entry) => entry.count), 1);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title={t('dashboard.demandBreakdownTitle')}
        description={t('dashboard.demandBreakdownDesc')}
        headerAction={
          <div
            role="group"
            aria-label={t('dashboard.demandBreakdownTitle')}
            className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5 text-xs"
          >
            <button
              type="button"
              aria-pressed={breakdownMode === 'status'}
              onClick={() => setBreakdownMode('status')}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                breakdownMode === 'status'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('dashboard.byStatus')}
            </button>
            <button
              type="button"
              aria-pressed={breakdownMode === 'category'}
              onClick={() => setBreakdownMode('category')}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                breakdownMode === 'category'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('dashboard.byCategory')}
            </button>
          </div>
        }
        isEmpty={
          breakdownMode === 'status' ? metrics.totalRequests === 0 : categoryData.length === 0
        }
        emptyLabel={t('dashboard.noRequestsInPeriod')}
      >
        {breakdownMode === 'status' ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="status"
                tick={TICK_STYLE}
                tickMargin={8}
                interval={0}
                angle={-22}
                textAnchor="end"
                height={80}
              />
              <YAxis allowDecimals={false} tick={TICK_STYLE} />
              <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                name={t('dashboard.requests')}
                fill={MNU_NAVY}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              layout="vertical"
              data={categoryData}
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
              <YAxis type="category" dataKey="category" width={110} tick={TICK_STYLE} />
              <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                name={t('dashboard.requests')}
                fill={MNU_GOLD_INK}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title={t('dashboard.technicianWorkload')}
        description={t('dashboard.technicianWorkloadDesc')}
        isEmpty={workloadData.length === 0}
        emptyLabel={t('technicians.noTechniciansFound')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={workloadData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={TICK_STYLE} tickMargin={6} />
            <YAxis allowDecimals={false} tick={TICK_STYLE} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="active"
              name={t('dashboard.active')}
              stackId="work"
              fill={MNU_NAVY}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="completed"
              name={t('dashboard.completed')}
              stackId="work"
              fill={MNU_GOLD_INK}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="flex h-full min-w-0 flex-col rounded-xl border-border bg-card shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground">
            <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{t('dashboard.hotspotsAndQualityTitle')}</span>
          </CardTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('dashboard.hotspotsAndQualityDesc')}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-5 pt-1">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-foreground">
              {t('dashboard.requestsByBuilding')}
            </p>
            {topBuildings.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('dashboard.noRequestsInPeriod')}</p>
            ) : (
              <div className="space-y-2.5">
                {topBuildings.map((entry) => {
                  const percent = Math.round(
                    (entry.count / Math.max(metrics.totalRequests, 1)) * 100,
                  );
                  return (
                    <div key={entry.name || entry.building} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span dir="auto" className="truncate font-medium text-foreground">
                          {pickLang(
                            entry.name || entry.building,
                            entry.nameAr || entry.buildingAr,
                          )}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatNumber(entry.count)} · {formatNumber(percent)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-150"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2.5 border-t border-border/75 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {t('dashboard.feedbackDistribution')}
              </p>
              {metrics.feedback.total > 0 ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatNumber(metrics.feedback.total)} {t('feedback.totalReviews')}
                </span>
              ) : null}
            </div>
            {metrics.feedback.total === 0 ? (
              <p className="text-xs text-muted-foreground">{t('dashboard.noFeedbackInPeriod')}</p>
            ) : (
              <div className="space-y-2">
                {[...metrics.feedback.distribution].reverse().map((entry) => (
                  <div key={entry.rating} className="flex items-center gap-2.5">
                    <span className="flex w-9 items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                      {formatNumber(entry.rating)}
                      <Star
                        className="h-3 w-3 fill-[hsl(var(--mnu-gold-ink))] text-[hsl(var(--mnu-gold-ink))]"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-[width] duration-150"
                        style={{
                          width: `${Math.round((entry.count / maxFeedback) * 100)}%`,
                          backgroundColor: MNU_GOLD_INK,
                        }}
                      />
                    </div>
                    <span className="w-7 text-end text-xs tabular-nums text-muted-foreground">
                      {formatNumber(entry.count)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
