import {
  Bell,
  ClipboardList,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { formatDate } from '@/lib/utils';
import type { RequestStatus } from '@/types/meta';
import type { StudentDashboard as StudentDashboardData } from '@/types/dashboard';

const ACTIVE_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'REOPENED',
];

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const activeRequests = ACTIVE_STATUSES.reduce(
    (sum, status) => sum + data.requests.byStatus[status],
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="My requests"
          value={data.requests.total}
          icon={ClipboardList}
          hint="In the selected period"
        />
        <DashboardStatCard
          label="Active requests"
          value={activeRequests}
          icon={ClipboardList}
          hint="Submitted through in progress"
        />
        <DashboardStatCard
          label="My claims"
          value={data.claims.total}
          icon={ShieldCheck}
          hint="Lost & found claims"
        />
        <DashboardStatCard
          label="My reports"
          value={data.reports.total}
          icon={PackageSearch}
          hint={`${data.reports.lost} lost · ${data.reports.found} found`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-sm">Recent requests</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Your latest maintenance submissions.
              </p>
            </div>
            <Link
              to="/maintenance/requests"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.requests.recent.length === 0 ? (
              <EmptyState
                title="No requests yet"
                description="Submit a maintenance request and follow its progress here."
                icon={ClipboardList}
                className="min-h-[170px]"
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {data.requests.recent.map((request) => (
                  <li key={request.id} className="py-2.5 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/maintenance/requests/${request.id}`}
                          className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {request.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {request.requestNumber} · {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={request.status} />
                        <PriorityBadge priority={request.priority} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                Notifications
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Updates about your requests, reports and claims.
              </p>
            </div>
            {data.notifications.unreadCount > 0 ? (
              <Badge variant="default" className="shrink-0">
                {data.notifications.unreadCount} unread
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="pt-2">
            {data.notifications.recent.length === 0 ? (
              <EmptyState
                title="You're all caught up"
                description="Notifications will appear here when something changes."
                icon={Bell}
                className="min-h-[170px]"
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {data.notifications.recent.map((notification) => (
                  <li key={notification.id} className="py-2.5 first:pt-1 last:pb-1">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDate(notification.createdAt, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {notification.linkUrl ? (
                            <>
                              {' · '}
                              <Link
                                to={notification.linkUrl}
                                className="font-medium text-primary hover:underline"
                              >
                                Open
                              </Link>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-sm">Recent claims</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Lost & found claims you submitted.
              </p>
            </div>
            <Link
              to="/lost-found/claims"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.claims.recent.length === 0 ? (
              <EmptyState
                title="No claims yet"
                description="Claims you submit for found items will appear here."
                icon={ShieldCheck}
                className="min-h-[150px]"
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {data.claims.recent.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/lost-found/claims/${claim.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {claim.itemTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {claim.claimNumber} · {formatDate(claim.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-sm">Recent lost & found reports</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Items you reported as lost or found.
              </p>
            </div>
            <Link
              to="/lost-found/my-reports"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.reports.recent.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Report a lost or found item to see it here."
                icon={PackageSearch}
                className="min-h-[150px]"
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {data.reports.recent.map((report) => (
                  <li
                    key={report.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/lost-found/items/${report.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {report.itemTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {report.reportNumber} · {report.reportType} ·{' '}
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
