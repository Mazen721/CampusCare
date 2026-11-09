import {
  Bell,
  ClipboardList,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { resolveParams, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { formatDate, formatNumber } from '@/lib/utils';
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
  const { t } = useTranslation();
  const activeRequests = ACTIVE_STATUSES.reduce(
    (sum, status) => sum + data.requests.byStatus[status],
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label={t('dashboard.myRequests')}
          value={data.requests.total}
          icon={ClipboardList}
          hint={t('dashboard.recentRequestsDesc')}
        />
        <DashboardStatCard
          label={t('dashboard.activeRequests')}
          value={activeRequests}
          icon={ClipboardList}
          hint={t('dashboard.active')}
        />
        <DashboardStatCard
          label={t('dashboard.myClaims')}
          value={data.claims.total}
          icon={ShieldCheck}
          hint={t('claims.title')}
        />
        <DashboardStatCard
          label={t('dashboard.myReports')}
          value={data.reports.total}
          icon={PackageSearch}
          hint={`${formatNumber(data.reports.lost)} ${t('dashboard.lost')} · ${formatNumber(data.reports.found)} ${t('dashboard.found')}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-sm">{t('dashboard.recentRequests')}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.recentRequestsDesc')}
              </p>
            </div>
            <Link
              to="/maintenance/requests"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {t('common.viewAll')}
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.requests.recent.length === 0 ? (
              <EmptyState
                title={t('requests.noRequestsYet')}
                description={t('dashboard.noRecentRequestsDesc')}
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
                          {tr(request, 'title')}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span dir="ltr">{request.requestNumber}</span> · {formatDate(request.createdAt)}
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
                {t('dashboard.notificationsTitle')}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.notificationsDesc')}
              </p>
            </div>
            {data.notifications.unreadCount > 0 ? (
              <Badge variant="default" className="shrink-0">
                {t('dashboard.unreadBadge', { count: data.notifications.unreadCount })}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="pt-2">
            {data.notifications.recent.length === 0 ? (
              <EmptyState
                title={t('dashboard.allCaughtUpTitle')}
                description={t('dashboard.allCaughtUpDesc')}
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
                          {notification.titleKey
                            ? t(`notif.${notification.titleKey}`, {
                                ...resolveParams(notification.params),
                                defaultValue: notification.title,
                              })
                            : notification.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {notification.messageKey
                            ? t(`notif.${notification.messageKey}`, {
                                ...resolveParams(notification.params),
                                defaultValue: notification.message,
                              })
                            : notification.message}
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
                                {t('common.open')}
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
              <CardTitle className="text-sm">{t('dashboard.recentClaims')}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.recentClaimsDesc')}
              </p>
            </div>
            <Link
              to="/lost-found/claims"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {t('common.viewAll')}
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.claims.recent.length === 0 ? (
              <EmptyState
                title={t('claims.noClaimsFound')}
                description={t('dashboard.noRecentClaimsDesc')}
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
                        {tr(claim, 'itemTitle')}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span dir="ltr">{claim.claimNumber}</span> · {formatDate(claim.createdAt)}
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
              <CardTitle className="text-sm">{t('dashboard.recentReports')}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.recentReportsDesc')}
              </p>
            </div>
            <Link
              to="/lost-found/my-reports"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {t('common.viewAll')}
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {data.reports.recent.length === 0 ? (
              <EmptyState
                title={t('lostFound.noReportsYet')}
                description={t('dashboard.noRecentReportsDesc')}
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
                        {tr(report, 'itemTitle')}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span dir="ltr">{report.reportNumber}</span> · {enumLabel('reportType', report.reportType)} ·{' '}
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
