import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, ScrollText, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { activityLogsApi } from '@/features/activity-logs/activityLogsApi';
import { PortalLedgerCard } from '@/features/dashboard/PortalLedgerCard';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { usersApi } from '@/features/users/usersApi';
import { resolveParams, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { cn, formatDate, formatNumber, getInitials } from '@/lib/utils';
import type { ActivityLogRecord } from '@/types/activityLogs';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';
import type { UserRecord } from '@/types/users';

function actionBadgeTone(action: string): string {
  if (
    /DELETE|DEACTIVATE|REJECT|CANCEL|DISMISS/.test(action)
  ) {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }
  if (
    /REOPEN|VERIFY|CONFIRM_MATCH|MATCH_CONFIRMED|UNDER_REVIEW|RESCHEDULE/.test(action)
  ) {
    return 'border-[hsl(var(--badge-warn-border)/0.6)] bg-[hsl(var(--badge-warn-bg))] text-[hsl(var(--badge-warn-fg))]';
  }
  if (
    /CREATE|ACTIVATE|APPROVE|HANDOVER|COMPLETE|CONFIRM/.test(action)
  ) {
    return 'border-primary/25 bg-primary/[0.08] text-primary';
  }
  return 'border-border bg-card text-muted-foreground';
}

function resolveActivityDescription(entry: ActivityLogRecord, t: TFunction): string {
  if (!entry.descriptionKey) return entry.description;
  return t(`activity.${entry.descriptionKey}`, {
    ...resolveParams(entry.params),
    defaultValue: entry.description,
  });
}

function GovernanceSummaryStrip({
  to,
  icon: Icon,
  label,
  highlight = false,
  summary,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  summary: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/75 pb-3 text-xs">
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          highlight
            ? 'border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] font-semibold text-[hsl(var(--mnu-navy))] hover:border-[hsl(var(--mnu-gold))]'
            : 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            highlight ? 'text-[hsl(var(--mnu-gold-ink))]' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />
        <span className="tabular-nums">{label}</span>
        <ChevronRight className="h-3.5 w-3.5 opacity-75 rtl:rotate-180" aria-hidden="true" />
      </Link>
      <span className="tabular-nums text-muted-foreground">{summary}</span>
    </div>
  );
}

function GovernanceLedgerRow({
  to,
  badges,
  badgesClassName,
  children,
}: {
  to: string;
  badges: ReactNode;
  badgesClassName?: string;
  children: ReactNode;
}) {
  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <Link
        to={to}
        className="group -mx-2 flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      >
        <div className="min-w-0 flex-1">{children}</div>
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5', badgesClassName)}>
          {badges}
        </div>
      </Link>
    </li>
  );
}

/**
 * Live two-column governance ledgers pairing the immutable system audit stream
 * with a live snapshot of provisioned university accounts.
 */
export function AdminGovernanceLedgers({ totals }: { totals: AdminDashboardData['totals'] }) {
  const { t } = useTranslation();

  const logsQuery = useQuery({
    queryKey: ['activity-logs', 'admin-dashboard-recent'],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 5 }),
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'admin-dashboard-directory'],
    queryFn: () => usersApi.list({ page: 1, limit: 5 }),
  });

  const recentLogs = logsQuery.data?.data ?? [];
  const totalLogs = logsQuery.data?.total ?? 0;
  const recentUsers = usersQuery.data?.data ?? [];
  const logsError = logsQuery.error ? getErrorMessage(logsQuery.error) : null;
  const usersError = usersQuery.error ? getErrorMessage(usersQuery.error) : null;

  const logsPillLabel = logsQuery.isLoading
    ? t('common.loading')
    : logsError
      ? t('nav.activityLogs')
      : t('dashboard.loggedEventsCount', { count: formatNumber(totalLogs) });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PortalLedgerCard
        title={t('dashboard.recentActivityTitle')}
        description={t('dashboard.recentActivityDesc')}
        icon={ScrollText}
        headerAction={<PortalViewAllLink to="/activity-logs" label={t('common.viewAll')} />}
        subHeader={
          <GovernanceSummaryStrip
            to="/activity-logs"
            icon={ScrollText}
            label={logsPillLabel}
            summary={t('dashboard.adminAuditReadOnly')}
          />
        }
        isLoading={logsQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={logsError}
        onRetry={() => void logsQuery.refetch()}
        isEmpty={recentLogs.length === 0}
        emptyTitle={t('activityLogs.noLogsFound')}
        emptyDescription={t('activityLogs.subtitle')}
        emptyIcon={ScrollText}
        emptyAction={{ label: t('dashboard.openActivityLogs'), to: '/activity-logs' }}
      >
        <ul className="divide-y divide-border/75">
          {recentLogs.map((entry) => (
            <GovernanceLedgerRow
              key={entry.id}
              to="/activity-logs"
              badges={
                <>
                  <Badge variant="outline" className="whitespace-nowrap border-border bg-secondary font-medium text-secondary-foreground">
                    {enumLabel('entityType', entry.entityType)}
                  </Badge>
                  <Badge variant="outline" className={cn('whitespace-nowrap font-medium', actionBadgeTone(entry.action))}>
                    {enumLabel('action', entry.action)}
                  </Badge>
                </>
              }
            >
              <span
                dir="auto"
                className="line-clamp-2 block text-start text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:truncate"
              >
                {resolveActivityDescription(entry, t)}
              </span>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                <bdi className="font-medium text-foreground/85">
                  {(entry.actor ? tr(entry.actor, 'name') : '') || t('activityLogs.deletedUser')}
                </bdi>
                {entry.actor?.role ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{enumLabel('role', entry.actor.role)}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <bdi className="tabular-nums">
                  {formatDate(entry.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                </bdi>
              </p>
            </GovernanceLedgerRow>
          ))}
        </ul>
      </PortalLedgerCard>

      <PortalLedgerCard
        title={t('dashboard.directorySnapshotTitle')}
        description={t('dashboard.directorySnapshotDesc')}
        icon={Users}
        headerAction={<PortalViewAllLink to="/users" label={t('common.viewAll')} />}
        subHeader={
          <GovernanceSummaryStrip
            to="/users"
            icon={Users}
            highlight={totals.activeUsers > 0}
            label={t('dashboard.activeAccountsPill', { count: formatNumber(totals.activeUsers) })}
            summary={t('dashboard.adminUsersHint', {
              active: formatNumber(totals.activeUsers),
              technicians: formatNumber(totals.technicians),
            })}
          />
        }
        isLoading={usersQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={usersError}
        onRetry={() => void usersQuery.refetch()}
        isEmpty={recentUsers.length === 0}
        emptyTitle={t('users.noUsersFound')}
        emptyDescription={t('users.subtitle')}
        emptyIcon={Users}
        emptyAction={{ label: t('dashboard.manageUsers'), to: '/users' }}
      >
        <ul className="divide-y divide-border/75">
          {recentUsers.map((account: UserRecord) => {
            const department = tr(account, 'department');
            return (
              <GovernanceLedgerRow
                key={account.id}
                to="/users"
                badgesClassName="ps-11 sm:ps-0"
                badges={
                  <>
                    <Badge variant="outline" className="whitespace-nowrap border-border bg-secondary font-medium text-secondary-foreground">
                      {enumLabel('role', account.role)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'whitespace-nowrap font-medium',
                        account.isActive
                          ? 'border-primary/25 bg-primary/[0.08] text-primary'
                          : 'border-destructive/30 bg-destructive/10 text-destructive',
                      )}
                    >
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', account.isActive ? 'bg-primary' : 'bg-destructive')}
                        aria-hidden="true"
                      />
                      {account.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </>
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/[0.08] text-xs font-semibold text-primary">
                      {getInitials(tr(account, 'name') || account.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-start text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                      <bdi>{tr(account, 'name') || account.name}</bdi>
                    </span>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span dir="ltr" className="truncate">{account.email}</span>
                      {department ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <bdi className="truncate">{department}</bdi>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </GovernanceLedgerRow>
            );
          })}
        </ul>
      </PortalLedgerCard>
    </div>
  );
}
