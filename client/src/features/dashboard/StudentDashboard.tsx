import { Bell, ChevronRight, ClipboardList, PackageSearch, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PortalLedgerRow } from '@/features/dashboard/PortalLedgerRow';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { StudentLedgerCard } from '@/features/dashboard/StudentLedgerCard';
import { StudentSummaryGrid } from '@/features/dashboard/StudentSummaryGrid';
import { ReportTypeBadge } from '@/features/lost-found/items/ReportTypeBadge';
import { resolveParams, tr } from '@/i18n/localize';
import { cn, formatDate } from '@/lib/utils';
import type { StudentDashboard as StudentDashboardData } from '@/types/dashboard';

/**
 * Status-ledger dashboard for students and employees covering requests,
 * notifications, claims, and lost-and-found reports.
 */
export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <StudentSummaryGrid data={data} />

      <div className="grid gap-5 lg:grid-cols-2">
        <StudentLedgerCard
          title={t('dashboard.recentRequests')}
          description={t('dashboard.recentRequestsDesc')}
          headerAction={<PortalViewAllLink to="/maintenance/requests" label={t('common.viewAll')} />}
          isEmpty={data.requests.recent.length === 0}
          emptyTitle={t('requests.noRequestsYet')}
          emptyDescription={t('dashboard.noRecentRequestsDesc')}
          emptyIcon={ClipboardList}
          emptyAction={{
            label: t('dashboard.newMaintenanceRequest'),
            to: '/maintenance/requests/new',
          }}
        >
          <ul className="divide-y divide-border/75">
            {data.requests.recent.map((request) => (
              <PortalLedgerRow
                key={request.id}
                to={`/maintenance/requests/${request.id}`}
                title={tr(request, 'title')}
                code={request.requestNumber}
                date={request.createdAt}
                badges={
                  <>
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority} />
                  </>
                }
              />
            ))}
          </ul>
        </StudentLedgerCard>

        <StudentLedgerCard
          title={t('dashboard.notificationsTitle')}
          description={t('dashboard.notificationsDesc')}
          icon={Bell}
          headerAction={
            data.notifications.unreadCount > 0 ? (
              <Badge
                variant="outline"
                className="border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] font-semibold text-[hsl(var(--mnu-navy))]"
              >
                {t('dashboard.unreadBadge', { count: data.notifications.unreadCount })}
              </Badge>
            ) : null
          }
          isEmpty={data.notifications.recent.length === 0}
          emptyTitle={t('dashboard.allCaughtUpTitle')}
          emptyDescription={t('dashboard.allCaughtUpDesc')}
          emptyIcon={Bell}
        >
          <ul className="divide-y divide-border/75">
            {data.notifications.recent.map((notification) => {
              const title = notification.titleKey
                ? t(`notif.${notification.titleKey}`, {
                    ...resolveParams(notification.params),
                    defaultValue: notification.title,
                  })
                : notification.title;
              const message = notification.messageKey
                ? t(`notif.${notification.messageKey}`, {
                    ...resolveParams(notification.params),
                    defaultValue: notification.message,
                  })
                : notification.message;
              const timestamp = formatDate(notification.createdAt, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });

              const content = (
                <>
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      notification.isRead ? 'bg-border' : 'bg-primary',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          notification.isRead
                            ? 'font-medium text-muted-foreground'
                            : 'font-semibold text-foreground',
                        )}
                      >
                        {title}
                      </p>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-muted-foreground">
                        <span>{timestamp}</span>
                        {notification.linkUrl ? (
                          <ChevronRight
                            className="h-3.5 w-3.5 text-muted-foreground/75 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                            aria-hidden="true"
                          />
                        ) : null}
                      </span>
                    </div>
                    <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                      {message}
                    </p>
                  </div>
                </>
              );

              return (
                <li key={notification.id} className="py-1 first:pt-0 last:pb-0">
                  {notification.linkUrl ? (
                    <Link
                      to={notification.linkUrl}
                      className="group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5 py-2">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </StudentLedgerCard>

        <StudentLedgerCard
          title={t('dashboard.recentClaims')}
          description={t('dashboard.recentClaimsDesc')}
          headerAction={<PortalViewAllLink to="/lost-found/claims" label={t('common.viewAll')} />}
          isEmpty={data.claims.recent.length === 0}
          emptyTitle={t('claims.noClaimsFound')}
          emptyDescription={t('dashboard.noRecentClaimsDesc')}
          emptyIcon={ShieldCheck}
          emptyAction={{
            label: t('dashboard.browseFoundItems'),
            to: '/lost-found',
          }}
        >
          <ul className="divide-y divide-border/75">
            {data.claims.recent.map((claim) => (
              <PortalLedgerRow
                key={claim.id}
                to={`/lost-found/claims/${claim.id}`}
                title={tr(claim, 'itemTitle')}
                code={claim.claimNumber}
                date={claim.createdAt}
                badges={<StatusBadge status={claim.status} className="shrink-0" />}
              />
            ))}
          </ul>
        </StudentLedgerCard>

        <StudentLedgerCard
          title={t('dashboard.recentReports')}
          description={t('dashboard.recentReportsDesc')}
          headerAction={<PortalViewAllLink to="/lost-found/my-reports" label={t('common.viewAll')} />}
          isEmpty={data.reports.recent.length === 0}
          emptyTitle={t('lostFound.noReportsYet')}
          emptyDescription={t('dashboard.noRecentReportsDesc')}
          emptyIcon={PackageSearch}
          emptyAction={{
            label: t('dashboard.reportLostFoundItem'),
            to: '/lost-found/report',
          }}
        >
          <ul className="divide-y divide-border/75">
            {data.reports.recent.map((report) => {
              const reportType = report.reportType === 'LOST' ? 'LOST' : 'FOUND';
              return (
                <PortalLedgerRow
                  key={report.id}
                  to={`/lost-found/items/${report.id}`}
                  title={tr(report, 'itemTitle')}
                  code={report.reportNumber}
                  date={report.createdAt}
                  badges={
                    <>
                      <ReportTypeBadge reportType={reportType} />
                      <StatusBadge status={report.status} />
                    </>
                  }
                />
              );
            })}
          </ul>
        </StudentLedgerCard>
      </div>
    </div>
  );
}