import type { TFunction } from 'i18next';
import { FilterX, ScrollText, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { activityLogsApi } from '@/features/activity-logs/activityLogsApi';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { usersApi } from '@/features/users/usersApi';
import { resolveParams, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { cn, formatDate, formatNumber, getInitials } from '@/lib/utils';
import type { ActivityLogRecord } from '@/types/activityLogs';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';
import type { UserRecord } from '@/types/users';

type AuditModuleFilter = 'ALL' | 'MAINTENANCE' | 'LOST_FOUND' | 'GOVERNANCE';

const AUDIT_MODULE_ENTITIES: Record<Exclude<AuditModuleFilter, 'ALL'>, ReadonlySet<string>> = {
  MAINTENANCE: new Set([
    'MaintenanceRequest',
    'WorkOrder',
    'PreventivePlan',
    'ServiceFeedback',
  ]),
  LOST_FOUND: new Set(['LostFoundItem', 'ItemMatch', 'ClaimRequest']),
  GOVERNANCE: new Set(['User', 'Location']),
};

function actionBadgeTone(action: string): string {
  if (/DELETE|DEACTIVATE|REJECT|CANCEL|DISMISS/.test(action)) {
    return 'border-destructive/25 bg-destructive/10 text-destructive';
  }
  if (/APPROVE|HANDOVER|COMPLETE|CONFIRM|ACTIVATE/.test(action)) {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700';
  }
  if (/REOPEN|VERIFY|UNDER_REVIEW|RESCHEDULE/.test(action)) {
    return 'border-amber-500/30 bg-amber-500/[0.12] text-amber-800';
  }
  return 'border-primary/20 bg-primary/[0.08] text-primary';
}

function resolveActivityDescription(entry: ActivityLogRecord, t: TFunction): string {
  if (!entry.descriptionKey) return entry.description;
  return t(`activity.${entry.descriptionKey}`, {
    ...resolveParams(entry.params),
    defaultValue: entry.description,
  });
}

function AuditTrailCard() {
  const { t } = useTranslation();
  const [moduleFilter, setModuleFilter] = useState<AuditModuleFilter>('ALL');

  const logsQuery = useQuery({
    queryKey: ['activity-logs', 'admin-dashboard-recent'],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 12 }),
  });

  const recentLogs = logsQuery.data?.data ?? [];
  const totalLogs = logsQuery.data?.total ?? 0;
  const logsError = logsQuery.error ? getErrorMessage(logsQuery.error) : null;

  const filteredLogs =
    moduleFilter === 'ALL'
      ? recentLogs
      : recentLogs.filter((entry) =>
          AUDIT_MODULE_ENTITIES[moduleFilter].has(entry.entityType),
        );

  const visibleLogs = filteredLogs.slice(0, 6);

  const filterTabs: Array<{ id: AuditModuleFilter; label: string }> = [
    { id: 'ALL', label: t('dashboard.adminAuditFilterAll') },
    { id: 'MAINTENANCE', label: t('dashboard.adminAuditFilterMaintenance') },
    { id: 'LOST_FOUND', label: t('dashboard.adminAuditFilterLostFound') },
    { id: 'GOVERNANCE', label: t('dashboard.adminAuditFilterGovernance') },
  ];

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border/80 bg-card shadow-xs lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/75 px-6 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground">
            <ScrollText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="sm:truncate">{t('dashboard.adminAuditTrailTitle')}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('dashboard.adminAuditTrailDesc')}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={t('dashboard.adminAuditTrailTitle')}
          className="inline-flex flex-wrap rounded-lg border border-border/80 bg-secondary/50 p-1 text-xs"
        >
          {filterTabs.map((tab) => {
            const selected = moduleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setModuleFilter(tab.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {logsQuery.isLoading ? (
          <LoadingState
            label={t('common.loading')}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
          />
        ) : logsError ? (
          <ErrorState
            message={logsError}
            onRetry={() => void logsQuery.refetch()}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
          />
        ) : recentLogs.length === 0 ? (
          <EmptyState
            title={t('activityLogs.noLogsFound')}
            description={t('activityLogs.subtitle')}
            icon={ScrollText}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/activity-logs">{t('dashboard.openActivityLogs')}</Link>
              </Button>
            }
          />
        ) : visibleLogs.length === 0 ? (
          <EmptyState
            title={t('dashboard.adminAuditFilterEmpty')}
            description={t('dashboard.adminAuditTrailDesc')}
            icon={FilterX}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModuleFilter('ALL')}
              >
                {t('dashboard.adminResetAuditFilter')}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/75 px-6">
            {visibleLogs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    <bdi className="font-semibold text-foreground">
                      {(entry.actor ? tr(entry.actor, 'name') : '') ||
                        t('activityLogs.deletedUser')}
                    </bdi>
                    {entry.actor?.role ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{enumLabel('role', entry.actor.role)}</span>
                      </>
                    ) : null}
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-foreground/85">
                      {enumLabel('entityType', entry.entityType)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <bdi className="tabular-nums">
                      {formatDate(entry.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </bdi>
                  </div>
                  <p
                    dir="auto"
                    className="line-clamp-2 text-start text-sm font-medium text-foreground sm:truncate"
                  >
                    {resolveActivityDescription(entry, t)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    'w-fit shrink-0 whitespace-nowrap font-medium',
                    actionBadgeTone(entry.action),
                  )}
                >
                  {enumLabel('action', entry.action)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/75 px-6 py-3">
        <span className="text-xs tabular-nums text-muted-foreground">
          {t('dashboard.loggedEventsCount', { count: formatNumber(totalLogs) })} ·{' '}
          {t('dashboard.adminAuditReadOnly')}
        </span>
        <PortalViewAllLink to="/activity-logs" label={t('common.viewAll')} />
      </div>
    </div>
  );
}

function AccountDirectoryRail({ totals }: { totals: AdminDashboardData['totals'] }) {
  const { t } = useTranslation();

  const usersQuery = useQuery({
    queryKey: ['users', 'admin-dashboard-directory'],
    queryFn: () => usersApi.list({ page: 1, limit: 6 }),
  });

  const recentUsers = usersQuery.data?.data ?? [];
  const usersError = usersQuery.error ? getErrorMessage(usersQuery.error) : null;

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-4">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border/75 pb-3.5">
          <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground">
            <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{t('dashboard.adminDirectoryRailTitle')}</span>
          </h2>
          <PortalViewAllLink to="/users" label={t('common.viewAll')} />
        </div>

        {usersQuery.isLoading ? (
          <LoadingState
            label={t('common.loading')}
            className="min-h-[220px] flex-1 border-0 bg-transparent px-2 py-6"
          />
        ) : usersError ? (
          <ErrorState
            message={usersError}
            onRetry={() => void usersQuery.refetch()}
            className="min-h-[220px] flex-1 border-0 bg-transparent px-2 py-6"
          />
        ) : recentUsers.length === 0 ? (
          <EmptyState
            title={t('users.noUsersFound')}
            description={t('users.subtitle')}
            icon={Users}
            className="min-h-[220px] flex-1 border-0 bg-transparent px-2 py-6"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/users">{t('dashboard.manageUsers')}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/70 py-1">
            {recentUsers.map((account: UserRecord) => {
              const displayName = tr(account, 'name') || account.name;
              return (
                <li key={account.id} className="py-3">
                  <Link
                    to="/users"
                    className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/[0.08] text-xs font-semibold text-primary">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                          <bdi>{displayName}</bdi>
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                          {account.email}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 whitespace-nowrap text-[11px] font-medium',
                        account.isActive
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
                          : 'border-destructive/30 bg-destructive/10 text-destructive',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          account.isActive ? 'bg-emerald-600' : 'bg-destructive',
                        )}
                        aria-hidden="true"
                      />
                      <span>{enumLabel('role', account.role)}</span>
                      <span className="sr-only">
                        {account.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-secondary/45 px-4 py-3 text-xs">
        <span className="font-medium text-muted-foreground">
          {t('dashboard.adminDirectoryRailFooterLabel')}
        </span>
        <span className="font-bold tabular-nums text-emerald-700">
          {t('dashboard.adminDirectoryRailFooterValue', {
            active: formatNumber(totals.activeUsers),
            total: formatNumber(totals.users),
          })}
        </span>
      </div>
    </div>
  );
}

/**
 * 12-column governance row pairing an 8-col filterable Cross-System Audit Trail
 * with a 4-col Account Directory & Status Rail.
 */
export function AdminGovernanceLedgers({ totals }: { totals: AdminDashboardData['totals'] }) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('dashboard.adminAuditTrailTitle')}
      className="grid gap-6 lg:grid-cols-12"
    >
      <AuditTrailCard />
      <AccountDirectoryRail totals={totals} />
    </section>
  );
}
