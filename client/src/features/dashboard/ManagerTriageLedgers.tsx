import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Inbox,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PortalLedgerCard } from '@/features/dashboard/PortalLedgerCard';
import { PortalLedgerRow } from '@/features/dashboard/PortalLedgerRow';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { ManagerMetrics } from '@/types/dashboard';
import type { MaintenanceRequestRecord } from '@/types/maintenance';
import type { Priority, RequestStatus } from '@/types/meta';
import type { WorkOrderRecord } from '@/types/workOrders';

const PRIORITY_RANK: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const REQUEST_STATUS_RANK: Partial<Record<RequestStatus, number>> = {
  REOPENED: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
};

function isWorkOrderOverdue(workOrder: WorkOrderRecord): boolean {
  if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
    return false;
  }
  if (!workOrder.expectedCompletion) {
    return false;
  }
  return new Date(workOrder.expectedCompletion).getTime() < Date.now();
}

function comparePendingRequests(a: MaintenanceRequestRecord, b: MaintenanceRequestRecord): number {
  const priorityDiff = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
  if (priorityDiff !== 0) return priorityDiff;

  const statusDiff = (REQUEST_STATUS_RANK[a.status] ?? 3) - (REQUEST_STATUS_RANK[b.status] ?? 3);
  if (statusDiff !== 0) return statusDiff;

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function compareDispatchWorkOrders(a: WorkOrderRecord, b: WorkOrderRecord): number {
  const overdueDiff = Number(isWorkOrderOverdue(b)) - Number(isWorkOrderOverdue(a));
  if (overdueDiff !== 0) return overdueDiff;

  const unassignedDiff =
    Number(a.status !== 'PENDING_ASSIGNMENT') - Number(b.status !== 'PENDING_ASSIGNMENT');
  if (unassignedDiff !== 0) return unassignedDiff;

  const priorityDiff = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
  if (priorityDiff !== 0) return priorityDiff;

  if (a.expectedCompletion && b.expectedCompletion) {
    return new Date(a.expectedCompletion).getTime() - new Date(b.expectedCompletion).getTime();
  }
  if (a.expectedCompletion) return -1;
  if (b.expectedCompletion) return 1;

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

interface ManagerSummaryStripProps {
  to: string;
  icon: LucideIcon;
  label: string;
  tone: 'gold' | 'danger' | 'neutral';
  summary: ReactNode;
}

function ManagerSummaryStrip({
  to,
  icon: Icon,
  label,
  tone,
  summary,
}: ManagerSummaryStripProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/75 pb-3 text-xs">
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          tone === 'danger'
            ? 'border-destructive/35 bg-destructive/10 font-semibold text-destructive hover:border-destructive'
            : tone === 'gold'
              ? 'border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] font-semibold text-[hsl(var(--mnu-navy))] hover:border-[hsl(var(--mnu-gold))]'
              : 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            tone === 'danger'
              ? 'text-destructive'
              : tone === 'gold'
                ? 'text-[hsl(var(--mnu-gold-ink))]'
                : 'text-muted-foreground',
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

interface ManagerTriageLedgersProps {
  metrics: ManagerMetrics;
}

/**
 * Live two-column operational triage ledgers pairing incoming/reopened requests
 * awaiting review with overdue, unassigned, and active work orders.
 */
export function ManagerTriageLedgers({ metrics }: ManagerTriageLedgersProps) {
  const { t } = useTranslation();

  const requestsQuery = useQuery({
    queryKey: ['maintenance-requests', 'manager-dashboard-triage'],
    queryFn: async () => {
      const [submitted, reopened, underReview] = await Promise.all([
        requestsApi.list({ status: 'SUBMITTED', limit: 5 }),
        requestsApi.list({ status: 'REOPENED', limit: 5 }),
        requestsApi.list({ status: 'UNDER_REVIEW', limit: 5 }),
      ]);

      const merged = new Map<string, MaintenanceRequestRecord>();
      [...reopened.data, ...submitted.data, ...underReview.data].forEach((request) => {
        merged.set(request.id, request);
      });

      const items = [...merged.values()].sort(comparePendingRequests).slice(0, 5);

      return {
        items,
        totalPending: submitted.total + reopened.total + underReview.total,
        reopenedTotal: reopened.total,
      };
    },
  });

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', 'manager-dashboard-dispatch'],
    queryFn: async () => {
      const [pendingAssignment, assigned, inProgress] = await Promise.all([
        workOrdersApi.list({ status: 'PENDING_ASSIGNMENT', limit: 8 }),
        workOrdersApi.list({ status: 'ASSIGNED', limit: 15 }),
        workOrdersApi.list({ status: 'IN_PROGRESS', limit: 15 }),
      ]);

      const merged = new Map<string, WorkOrderRecord>();
      [...pendingAssignment.data, ...assigned.data, ...inProgress.data].forEach((wo) => {
        merged.set(wo.id, wo);
      });

      const items = [...merged.values()].sort(compareDispatchWorkOrders).slice(0, 5);

      return {
        items,
        unassignedTotal: pendingAssignment.total,
      };
    },
  });

  const pendingRequests = requestsQuery.data?.items ?? [];
  const livePendingTotal = requestsQuery.data?.totalPending ?? 0;
  const liveReopenedTotal = requestsQuery.data?.reopenedTotal ?? 0;

  const dispatchWorkOrders = workOrdersQuery.data?.items ?? [];
  const unassignedTotal = workOrdersQuery.data?.unassignedTotal ?? 0;

  const requestsError = requestsQuery.error ? getErrorMessage(requestsQuery.error) : null;
  const workOrdersError = workOrdersQuery.error ? getErrorMessage(workOrdersQuery.error) : null;

  const dispatchTone: 'danger' | 'gold' | 'neutral' =
    metrics.overdueWorkOrders > 0
      ? 'danger'
      : unassignedTotal > 0
        ? 'gold'
        : 'neutral';

  const dispatchPillLabel =
    metrics.overdueWorkOrders > 0
      ? t('dashboard.overdueCountPill', { count: formatNumber(metrics.overdueWorkOrders) })
      : unassignedTotal > 0
        ? t('dashboard.unassignedCountSummary', { count: formatNumber(unassignedTotal) })
        : t('dashboard.overdueCountPill', { count: formatNumber(0) });

  const dispatchPillTo =
    metrics.overdueWorkOrders === 0 && unassignedTotal > 0
      ? '/work-orders?status=PENDING_ASSIGNMENT'
      : '/work-orders';

  const dispatchPillIcon =
    metrics.overdueWorkOrders > 0
      ? TriangleAlert
      : unassignedTotal > 0
        ? ClipboardCheck
        : CheckCircle2;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PortalLedgerCard
        title={t('dashboard.pendingRequestQueueTitle')}
        description={t('dashboard.pendingRequestQueueDesc')}
        icon={Inbox}
        headerAction={
          <PortalViewAllLink to="/maintenance/request-queue" label={t('common.viewAll')} />
        }
        subHeader={
          <ManagerSummaryStrip
            to="/maintenance/request-queue"
            icon={Inbox}
            tone={livePendingTotal > 0 ? 'gold' : 'neutral'}
            label={t('dashboard.awaitingReviewCount', {
              count: formatNumber(livePendingTotal),
            })}
            summary={
              <>
                {liveReopenedTotal > 0 ? (
                  <>
                    <strong className="font-semibold text-foreground">
                      {t('dashboard.reopenedCountSummary', {
                        count: formatNumber(liveReopenedTotal),
                      })}
                    </strong>
                    {' · '}
                  </>
                ) : null}
                {t('dashboard.managerTotalRequestsHint', {
                  total: formatNumber(metrics.totalRequests),
                })}
              </>
            }
          />
        }
        isLoading={requestsQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={requestsError}
        onRetry={() => void requestsQuery.refetch()}
        isEmpty={pendingRequests.length === 0}
        emptyTitle={t('requests.queueClearTitle')}
        emptyDescription={t('dashboard.noPendingRequestsDesc')}
        emptyIcon={Inbox}
        emptyAction={{
          label: t('dashboard.viewAllRequests'),
          to: '/maintenance/requests',
        }}
      >
        <ul className="divide-y divide-border/75">
          {pendingRequests.map((request) => (
            <PortalLedgerRow
              key={request.id}
              to={`/maintenance/requests/${request.id}`}
              title={tr(request, 'title')}
              code={request.requestNumber}
              metaItems={
                [
                  request.requester?.name,
                  enumLabel('maintenanceCategory', request.category),
                ].filter(Boolean) as string[]
              }
              date={request.createdAt}
              location={request.location ? formatLocation(request.location) : undefined}
              badges={
                <>
                  <StatusBadge status={request.status} />
                  <PriorityBadge priority={request.priority} />
                </>
              }
            />
          ))}
        </ul>
      </PortalLedgerCard>

      <PortalLedgerCard
        title={t('dashboard.workOrderDispatchTitle')}
        description={t('dashboard.workOrderDispatchDesc')}
        icon={Wrench}
        headerAction={<PortalViewAllLink to="/work-orders" label={t('common.viewAll')} />}
        subHeader={
          <ManagerSummaryStrip
            to={dispatchPillTo}
            icon={dispatchPillIcon}
            tone={dispatchTone}
            label={dispatchPillLabel}
            summary={
              <>
                {metrics.overdueWorkOrders > 0 && unassignedTotal > 0 ? (
                  <>
                    <strong className="font-semibold text-foreground">
                      {t('dashboard.unassignedCountSummary', {
                        count: formatNumber(unassignedTotal),
                      })}
                    </strong>
                    {' · '}
                  </>
                ) : null}
                {t('dashboard.activeTechniciansSummary', {
                  count: formatNumber(metrics.technicianWorkload.length),
                })}
              </>
            }
          />
        }
        isLoading={workOrdersQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={workOrdersError}
        onRetry={() => void workOrdersQuery.refetch()}
        isEmpty={dispatchWorkOrders.length === 0}
        emptyTitle={t('dashboard.noActiveDispatchTitle')}
        emptyDescription={t('dashboard.managerNoDispatchDesc')}
        emptyIcon={Wrench}
        emptyAction={{
          label: t('nav.workOrders'),
          to: '/work-orders',
        }}
      >
        <ul className="divide-y divide-border/75">
          {dispatchWorkOrders.map((workOrder) => {
            const overdue = isWorkOrderOverdue(workOrder);
            const assignee = workOrder.assignedTechnician?.name ?? t('workOrders.unassigned');
            const categoryLabel = enumLabel('maintenanceCategory', workOrder.category);
            const metaItems = workOrder.expectedCompletion
              ? [
                  assignee,
                  categoryLabel,
                  t('dashboard.dueByLabel', {
                    date: formatDate(workOrder.expectedCompletion),
                  }),
                ]
              : [assignee, categoryLabel];

            return (
              <PortalLedgerRow
                key={workOrder.id}
                to={`/work-orders/${workOrder.id}`}
                title={tr(workOrder, 'title')}
                code={workOrder.workOrderNumber}
                metaItems={metaItems}
                date={workOrder.expectedCompletion ? undefined : workOrder.createdAt}
                location={workOrder.location ? formatLocation(workOrder.location) : undefined}
                badges={
                  <>
                    {overdue ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-destructive/40 bg-destructive/10 font-semibold text-destructive ltr:uppercase ltr:tracking-wide"
                      >
                        {t('common.overdue')}
                      </Badge>
                    ) : null}
                    <StatusBadge status={workOrder.status} />
                    <PriorityBadge priority={workOrder.priority} />
                  </>
                }
              />
            );
          })}
        </ul>
      </PortalLedgerCard>
    </div>
  );
}
