import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Star,
  Timer,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { TechnicianCharts } from '@/features/dashboard/TechnicianCharts';
import { formatDate } from '@/lib/utils';
import type { TechnicianDashboard as TechnicianDashboardData } from '@/types/dashboard';

export function TechnicianDashboard({ data }: { data: TechnicianDashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <DashboardStatCard label="Assigned" value={data.counts.assigned} icon={Wrench} />
        <DashboardStatCard label="In progress" value={data.counts.inProgress} icon={Clock3} />
        <DashboardStatCard
          label="Overdue"
          value={data.counts.overdue}
          icon={TriangleAlert}
          tone={data.counts.overdue > 0 ? 'danger' : 'success'}
        />
        <DashboardStatCard
          label="Completed"
          value={data.counts.completed}
          icon={CheckCircle2}
          tone="success"
          hint="In this period"
        />
        <DashboardStatCard
          label="Avg. resolution"
          value={
            data.analytics?.averageResolutionHours !== null &&
            data.analytics?.averageResolutionHours !== undefined
              ? `${data.analytics.averageResolutionHours} h`
              : '—'
          }
          icon={Timer}
          hint="Start to completion"
        />
        <DashboardStatCard
          label="My rating"
          value={
            data.analytics?.averageRating !== null &&
            data.analytics?.averageRating !== undefined
              ? data.analytics.averageRating.toFixed(1)
              : '—'
          }
          icon={Star}
          tone="warning"
          hint={`${data.analytics?.feedbackCount ?? 0} review${data.analytics?.feedbackCount === 1 ? '' : 's'}`}
        />
      </div>

      {data.analytics ? <TechnicianCharts analytics={data.analytics} /> : null}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
            Your schedule
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Assigned and in-progress work orders, soonest first.
          </p>
        </CardHeader>
        <CardContent className="pt-1">
          {data.schedule.length === 0 ? (
            <EmptyState
              title="No active work orders"
              description="Assigned and in-progress jobs will appear here."
              icon={Wrench}
              className="min-h-[180px]"
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {data.schedule.map((workOrder) => (
                <li key={workOrder.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/work-orders/${workOrder.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {workOrder.title}
                        </Link>
                        {workOrder.overdue ? (
                          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                            Overdue
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {workOrder.workOrderNumber} · {workOrder.category}
                        {workOrder.location
                          ? ` · ${workOrder.location.buildingName}, ${workOrder.location.floor}, Room ${workOrder.location.room}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={workOrder.priority} />
                      <StatusBadge status={workOrder.status} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {workOrder.scheduledStart
                      ? `Scheduled ${formatDate(workOrder.scheduledStart, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`
                      : 'Not scheduled'}
                    {workOrder.expectedCompletion
                      ? ` · Due ${formatDate(workOrder.expectedCompletion, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
