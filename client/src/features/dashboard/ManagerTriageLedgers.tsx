import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { CheckCircle2, Inbox, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { pickLang, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { ManagerMetrics } from '@/types/dashboard';
import type { MaintenanceRequestRecord } from '@/types/maintenance';
import type { Priority } from '@/types/meta';
import type { WorkOrderRecord } from '@/types/workOrders';

const PRIORITY_RANK: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

type TriageTab = 'unassigned' | 'overdue';

interface TriageRowItem {
  id: string;
  to: string;
  title: string;
  code: string;
  building: string;
  date: string;
  priority: Priority;
  status: string;
  actionLabel: string;
  usePriorityBadge: boolean;
}

interface HealthMetricItem {
  key: string;
  label: string;
  value: string;
  pct: number;
  barClass: string;
}

function isWorkOrderOverdue(workOrder: WorkOrderRecord): boolean {
  if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
    return false;
  }
  if (!workOrder.expectedCompletion) {
    return false;
  }
  return new Date(workOrder.expectedCompletion).getTime() < Date.now();
}

function getBuildingLabel(
  location: { buildingName: string; buildingNameAr?: string } | null | undefined,
  fallback: string,
): string {
  if (!location) return fallback;
  return pickLang(location.buildingName, location.buildingNameAr) || fallback;
}

function comparePriorityAsc(a: Priority, b: Priority): number {
  return (PRIORITY_RANK[a] ?? 4) - (PRIORITY_RANK[b] ?? 4);
}

function buildUnassignedRows(
  workOrders: WorkOrderRecord[],
  requests: MaintenanceRequestRecord[],
  t: TFunction,
): TriageRowItem[] {
  const fallbackBuilding = t('common.none');

  const workOrderRows: TriageRowItem[] = workOrders.map((wo) => ({
    id: `wo-${wo.id}`,
    to: `/work-orders/${wo.id}`,
    title: tr(wo, 'title'),
    code: wo.workOrderNumber,
    building: getBuildingLabel(wo.location, fallbackBuilding),
    date: wo.expectedCompletion ?? wo.createdAt,
    priority: wo.priority,
    status: wo.status,
    actionLabel: t('dashboard.actionAssign'),
    usePriorityBadge: wo.priority === 'CRITICAL' || wo.priority === 'HIGH',
  }));

  const requestRows: TriageRowItem[] = requests.map((req) => ({
    id: `req-${req.id}`,
    to: `/maintenance/requests/${req.id}`,
    title: tr(req, 'title'),
    code: req.requestNumber,
    building: getBuildingLabel(req.location, fallbackBuilding),
    date: req.createdAt,
    priority: req.priority,
    status: req.status,
    actionLabel: t('dashboard.actionReview'),
    usePriorityBadge: req.priority === 'CRITICAL' || req.priority === 'HIGH',
  }));

  return [...workOrderRows, ...requestRows]
    .sort((a, b) => {
      const priorityDiff = comparePriorityAsc(a.priority, b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);
}

function buildOverdueRows(workOrders: WorkOrderRecord[], t: TFunction): TriageRowItem[] {
  const fallbackBuilding = t('common.none');

  return workOrders.slice(0, 5).map((wo) => ({
    id: `overdue-${wo.id}`,
    to: `/work-orders/${wo.id}`,
    title: tr(wo, 'title'),
    code: wo.workOrderNumber,
    building: getBuildingLabel(wo.location, fallbackBuilding),
    date: wo.expectedCompletion ?? wo.createdAt,
    priority: wo.priority,
    status: 'OVERDUE',
    actionLabel: t('dashboard.actionInspect'),
    usePriorityBadge: false,
  }));
}

function buildHealthBreakdown(metrics: ManagerMetrics, t: TFunction): HealthMetricItem[] {
  const totalWorkOrders = metrics.activeWorkOrders + metrics.completedWorkOrders;
  const openAndCompleted = Math.max(totalWorkOrders, metrics.overdueWorkOrders);
  const onTimeSlaPct =
    openAndCompleted > 0
      ? Math.max(
          0,
          Math.round(((openAndCompleted - metrics.overdueWorkOrders) / openAndCompleted) * 100),
        )
      : 0;

  const resolvedRequests =
    metrics.requestsByStatus.COMPLETED + metrics.requestsByStatus.CLOSED;
  const resolutionRatePct =
    metrics.totalRequests > 0 ? Math.round((resolvedRequests / metrics.totalRequests) * 100) : 0;
  const woCompletionPct =
    totalWorkOrders > 0 ? Math.round((metrics.completedWorkOrders / totalWorkOrders) * 100) : 0;
  const serviceRatingPct =
    metrics.feedback.averageRating !== null
      ? Math.round((metrics.feedback.averageRating / 5) * 100)
      : 0;

  const slaBarTone =
    onTimeSlaPct >= 85
      ? 'bg-emerald-600'
      : onTimeSlaPct >= 60
        ? 'bg-amber-600'
        : 'bg-destructive';

  return [
    {
      key: 'sla',
      label: t('dashboard.onTimeSlaRate'),
      value: `${formatNumber(onTimeSlaPct)}%`,
      pct: onTimeSlaPct,
      barClass: slaBarTone,
    },
    {
      key: 'resolution',
      label: t('dashboard.resolutionRate'),
      value: `${formatNumber(resolutionRatePct)}%`,
      pct: resolutionRatePct,
      barClass: 'bg-primary',
    },
    {
      key: 'completion',
      label: t('dashboard.workOrderCompletionRate'),
      value: `${formatNumber(woCompletionPct)}%`,
      pct: woCompletionPct,
      barClass: 'bg-emerald-600',
    },
    {
      key: 'quality',
      label: t('dashboard.serviceQuality'),
      value:
        metrics.feedback.averageRating !== null
          ? `${formatNumber(metrics.feedback.averageRating, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} / 5`
          : t('dashboard.noRatingYet'),
      pct: serviceRatingPct,
      barClass: 'bg-amber-600',
    },
  ];
}

function TriageTabButton({
  selected,
  label,
  count,
  alertTone = false,
  onClick,
}: {
  selected: boolean;
  label: string;
  count: number;
  alertTone?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          alertTone ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground',
        )}
      >
        {formatNumber(count)}
      </span>
    </button>
  );
}

function TriageLedgerRow({ item }: { item: TriageRowItem }) {
  return (
    <li className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-secondary/35 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <p dir="auto" className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span dir="ltr" className="font-mono font-medium tabular-nums">
            {item.code}
          </span>
          <span aria-hidden="true">•</span>
          <bdi className="truncate">{item.building}</bdi>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">{formatDate(item.date)}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {item.usePriorityBadge ? (
          <PriorityBadge priority={item.priority} />
        ) : (
          <StatusBadge status={item.status} />
        )}
        <Link
          to={item.to}
          className="inline-flex h-8 items-center rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.actionLabel}
        </Link>
      </div>
    </li>
  );
}

function TriageQueuePanel({
  activeTab,
  onTabChange,
  unassignedTotal,
  overdueTotal,
  rows,
  isLoading,
  activeError,
  onRetry,
}: {
  activeTab: TriageTab;
  onTabChange: (tab: TriageTab) => void;
  unassignedTotal: number;
  overdueTotal: number;
  rows: TriageRowItem[];
  isLoading: boolean;
  activeError: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border/80 bg-card shadow-xs lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/75 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            {t('dashboard.triageQueueTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('dashboard.triageQueueDesc')}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={t('dashboard.triageQueueTitle')}
          className="inline-flex rounded-lg border border-border/80 bg-secondary/50 p-1 text-xs"
        >
          <TriageTabButton
            selected={activeTab === 'unassigned'}
            label={t('dashboard.unassignedQueueTab')}
            count={unassignedTotal}
            onClick={() => onTabChange('unassigned')}
          />
          <TriageTabButton
            selected={activeTab === 'overdue'}
            label={t('dashboard.overdueEscalationsTab')}
            count={overdueTotal}
            alertTone={overdueTotal > 0}
            onClick={() => onTabChange('overdue')}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {isLoading ? (
          <LoadingState
            label={t('common.loading')}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
          />
        ) : activeError ? (
          <ErrorState
            message={activeError}
            onRetry={onRetry}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'unassigned'
                ? t('dashboard.noUnassignedQueueTitle')
                : t('dashboard.noOverdueEscalationsTitle')
            }
            description={
              activeTab === 'unassigned'
                ? t('dashboard.noUnassignedQueueDesc')
                : t('dashboard.noOverdueEscalationsDesc')
            }
            icon={activeTab === 'unassigned' ? Inbox : CheckCircle2}
            className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
          />
        ) : (
          <ul className="divide-y divide-border/75">
            {rows.map((item) => (
              <TriageLedgerRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/75 px-6 py-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {activeTab === 'unassigned'
            ? t('dashboard.awaitingReviewCount', { count: formatNumber(unassignedTotal) })
            : t('dashboard.overdueCountPill', { count: formatNumber(overdueTotal) })}
        </span>
        <PortalViewAllLink
          to={activeTab === 'unassigned' ? '/maintenance/request-queue' : '/work-orders'}
          label={t('common.viewAll')}
        />
      </div>
    </div>
  );
}

function SlaHealthPanel({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();
  const healthBreakdown = buildHealthBreakdown(metrics, t);

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-4">
      <div className="space-y-5">
        <div className="border-b border-border/75 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t('dashboard.slaHealthTitle')}</span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t('dashboard.slaHealthDesc')}
          </p>
        </div>

        <div className="space-y-4">
          {healthBreakdown.map((metric) => (
            <div key={metric.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">{metric.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
                  {metric.value}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-200', metric.barClass)}
                  style={{ width: `${Math.max(0, Math.min(100, metric.pct))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-secondary/45 px-4 py-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <TriangleAlert
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              metrics.overdueWorkOrders > 0 ? 'text-destructive' : 'text-emerald-600',
            )}
            aria-hidden="true"
          />
          <span>{t('dashboard.overdue')}</span>
        </span>
        <span
          className={cn(
            'font-bold tabular-nums',
            metrics.overdueWorkOrders > 0 ? 'text-destructive' : 'text-emerald-700',
          )}
        >
          {formatNumber(metrics.overdueWorkOrders)}
        </span>
      </div>
    </div>
  );
}

/**
 * Spacious 12-column Bento workspace pairing a tabbed triage/escalation ledger (8 cols)
 * with an SLA Health & Resolution Rate breakdown card (4 cols).
 */
export function ManagerTriageLedgers({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TriageTab>('unassigned');

  const requestsQuery = useQuery({
    queryKey: ['maintenance-requests', 'manager-dashboard-triage'],
    queryFn: async () => {
      const [submitted, reopened, underReview] = await Promise.all([
        requestsApi.list({ status: 'SUBMITTED', limit: 6 }),
        requestsApi.list({ status: 'REOPENED', limit: 6 }),
        requestsApi.list({ status: 'UNDER_REVIEW', limit: 6 }),
      ]);

      const merged = new Map<string, (typeof submitted.data)[number]>();
      [...reopened.data, ...submitted.data, ...underReview.data].forEach((request) => {
        merged.set(request.id, request);
      });

      return {
        items: [...merged.values()],
        total: submitted.total + reopened.total + underReview.total,
      };
    },
  });

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', 'manager-dashboard-dispatch'],
    queryFn: async () => {
      const [pendingAssignment, assigned, inProgress] = await Promise.all([
        workOrdersApi.list({ status: 'PENDING_ASSIGNMENT', limit: 10 }),
        workOrdersApi.list({ status: 'ASSIGNED', limit: 15 }),
        workOrdersApi.list({ status: 'IN_PROGRESS', limit: 15 }),
      ]);

      const allOpen = new Map<string, WorkOrderRecord>();
      [...pendingAssignment.data, ...assigned.data, ...inProgress.data].forEach((wo) => {
        allOpen.set(wo.id, wo);
      });

      const overdue = [...allOpen.values()]
        .filter(isWorkOrderOverdue)
        .sort((a, b) => {
          const priorityDiff = comparePriorityAsc(a.priority, b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          return (
            new Date(a.expectedCompletion ?? a.createdAt).getTime() -
            new Date(b.expectedCompletion ?? b.createdAt).getTime()
          );
        });

      return {
        unassigned: pendingAssignment.data,
        unassignedTotal: pendingAssignment.total,
        overdue,
      };
    },
  });

  const unassignedRows = buildUnassignedRows(
    workOrdersQuery.data?.unassigned ?? [],
    requestsQuery.data?.items ?? [],
    t,
  );
  const overdueRows = buildOverdueRows(workOrdersQuery.data?.overdue ?? [], t);

  const unassignedTotal =
    (requestsQuery.data?.total ?? 0) + (workOrdersQuery.data?.unassignedTotal ?? 0);
  const overdueTotal = Math.max(
    metrics.overdueWorkOrders,
    workOrdersQuery.data?.overdue.length ?? 0,
  );

  const isLoading =
    activeTab === 'unassigned'
      ? requestsQuery.isLoading || workOrdersQuery.isLoading
      : workOrdersQuery.isLoading;

  const requestsError = requestsQuery.error ? getErrorMessage(requestsQuery.error) : null;
  const workOrdersError = workOrdersQuery.error ? getErrorMessage(workOrdersQuery.error) : null;
  const activeError =
    activeTab === 'unassigned' ? (requestsError ?? workOrdersError) : workOrdersError;

  return (
    <section
      aria-label={t('dashboard.triageQueueTitle')}
      className="grid gap-6 lg:grid-cols-12"
    >
      <TriageQueuePanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unassignedTotal={unassignedTotal}
        overdueTotal={overdueTotal}
        rows={activeTab === 'unassigned' ? unassignedRows : overdueRows}
        isLoading={isLoading}
        activeError={activeError}
        onRetry={() => {
          void requestsQuery.refetch();
          void workOrdersQuery.refetch();
        }}
      />
      <SlaHealthPanel metrics={metrics} />
    </section>
  );
}
