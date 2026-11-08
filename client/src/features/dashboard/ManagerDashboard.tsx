import {
  Building2,
  ClipboardList,
  MessageSquare,
  Star,
  Timer,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { ManagerCharts } from '@/features/dashboard/ManagerCharts';
import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ManagerDashboard as ManagerDashboardData } from '@/types/dashboard';

function formatHours(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)} h`;
}

function formatRating(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  const { metrics } = data;
  const maxFeedback = Math.max(...metrics.feedback.distribution.map((entry) => entry.count), 1);
  const topBuildings = metrics.requestsByBuilding.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label="Total requests"
          value={metrics.totalRequests}
          icon={ClipboardList}
          hint="Created in the selected period"
        />
        <DashboardStatCard
          label="Active work orders"
          value={metrics.activeWorkOrders}
          icon={Wrench}
          hint="Assigned or in progress"
        />
        <DashboardStatCard
          label="Overdue"
          value={metrics.overdueWorkOrders}
          icon={TriangleAlert}
          tone={metrics.overdueWorkOrders > 0 ? 'danger' : 'success'}
          hint="Past expected completion"
        />
        <DashboardStatCard
          label="Avg. resolution"
          value={formatHours(metrics.averageResolutionHours)}
          icon={Timer}
          hint="Start to completion"
        />
        <DashboardStatCard
          label="Feedback rating"
          value={formatRating(metrics.feedback.averageRating)}
          icon={Star}
          tone="warning"
          hint={`${metrics.feedback.total} response${metrics.feedback.total === 1 ? '' : 's'}`}
        />
      </div>

      <ManagerCharts metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Requests by building
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Where maintenance demand is concentrated in this period.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {topBuildings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests in this period.</p>
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
              Feedback distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Service feedback received in this period.
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
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
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
