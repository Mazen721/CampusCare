import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  Play,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { AssignWorkOrderDialog } from '@/features/maintenance/work-orders/AssignWorkOrderDialog';
import { CancelWorkOrderDialog } from '@/features/maintenance/work-orders/CancelWorkOrderDialog';
import { CompleteWorkOrderDialog } from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { WORK_ORDER_STATUSES, type WorkOrderStatus } from '@/types/meta';
import type { WorkOrderRecord } from '@/types/workOrders';

const PAGE_SIZE = 10;

export function WorkOrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const rawStatusParam = searchParams.get('status');
  const paramStatus: 'ALL' | WorkOrderStatus =
    rawStatusParam && WORK_ORDER_STATUSES.includes(rawStatusParam as WorkOrderStatus)
      ? (rawStatusParam as WorkOrderStatus)
      : 'ALL';

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>(paramStatus);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'REACTIVE' | 'PREVENTIVE'>('ALL');

  useEffect(() => {
    setStatusFilter(paramStatus);
    setPage(1);
  }, [paramStatus]);

  const [assignTarget, setAssignTarget] = useState<WorkOrderRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<WorkOrderRecord | null>(null);
  const [completeTarget, setCompleteTarget] = useState<WorkOrderRecord | null>(null);
  const [startTarget, setStartTarget] = useState<WorkOrderRecord | null>(null);

  const isTechnician = user?.role === 'TECHNICIAN';
  const isManager = user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';
  const canManageWorkOrders = user?.role === 'MAINTENANCE_MANAGER';

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', { page, statusFilter, sourceFilter }],
    queryFn: () =>
      workOrdersApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sourceType: sourceFilter === 'ALL' ? undefined : sourceFilter,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => workOrdersApi.start(id),
    onSuccess: async () => {
      setStartTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      toast.success(t('workOrders.workOrderStartedSuccess'));
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, t('errors.network')));
    },
  });

  const workOrders = workOrdersQuery.data?.data ?? [];
  const total = workOrdersQuery.data?.total ?? 0;

  const isOverdue = (wo: WorkOrderRecord) => {
    if (wo.status === 'COMPLETED' || wo.status === 'CANCELLED') return false;
    if (!wo.expectedCompletion) return false;
    return new Date(wo.expectedCompletion).getTime() < Date.now();
  };

  const columns: Array<DataTableColumn<WorkOrderRecord>> = [
    {
      id: 'workOrder',
      header: t('workOrders.title'),
      cell: (wo) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/work-orders/${wo.id}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              <span dir="ltr">{wo.workOrderNumber}</span>
            </Link>
            <Badge variant="outline" className="text-xs py-0 px-1.5 font-normal">
              {enumLabel('sourceType', wo.sourceType)}
            </Badge>
          </div>
          <p className="truncate text-xs font-medium text-foreground max-w-[240px]">
            {tr(wo, 'title')}
          </p>
          <span className="text-xs text-muted-foreground">
            {enumLabel('maintenanceCategory', wo.category)}
          </span>
        </div>
      ),
    },
    {
      id: 'priorityStatus',
      header: t('workOrders.statusAndPriority'),
      cell: (wo) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={wo.status} />
          <PriorityBadge priority={wo.priority} />
        </div>
      ),
    },
    {
      id: 'location',
      header: t('common.location'),
      cell: (wo) => (
        <div className="text-xs text-muted-foreground">
          {wo.location ? (
            <p className="font-medium text-foreground">{formatLocation(wo.location)}</p>
          ) : (
            '—'
          )}
        </div>
      ),
    },
    ...(isManager
      ? [
          {
            id: 'technician',
            header: t('workOrders.technician'),
            cell: (wo: WorkOrderRecord) => (
              <div className="text-xs">
                {wo.assignedTechnician ? (
                  <span className="font-medium text-foreground">
                    <bdi>{wo.assignedTechnician.name}</bdi>
                  </span>
                ) : (
                  <span className="text-amber-600 italic">{t('workOrders.unassigned')}</span>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'schedule',
      header: t('workOrders.schedule'),
      cell: (wo) => {
        const overdue = isOverdue(wo);
        return (
          <div className="text-xs">
            {wo.expectedCompletion ? (
              <div className={`flex items-center gap-1 ${overdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                <span>{formatDate(wo.expectedCompletion)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{t('workOrders.unscheduled')}</span>
            )}
            {overdue && (
              <span className="text-xs font-medium text-destructive ltr:uppercase ltr:tracking-wider block">
                {t('workOrders.overdue')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (wo) => (
        <div className="flex items-center justify-end gap-1">
          {/* Technician quick actions */}
          {isTechnician && wo.status === 'ASSIGNED' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs border-border bg-card text-foreground hover:border-[hsl(var(--mnu-gold))] hover:bg-[hsl(var(--mnu-gold-tint))] hover:text-foreground"
              onClick={() => setStartTarget(wo)}
              disabled={startMutation.isPending}
            >
              <Play className="h-3.5 w-3.5 me-1 text-[hsl(var(--mnu-gold-ink))] rtl:rotate-180" aria-hidden="true" />
              {t('workOrders.start')}
            </Button>
          )}

          {isTechnician && wo.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => setCompleteTarget(wo)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 me-1" aria-hidden="true" />
              {t('workOrders.complete')}
            </Button>
          )}

          {/* Manager assign/cancel actions */}
          {canManageWorkOrders && (wo.status === 'PENDING_ASSIGNMENT' || wo.status === 'ASSIGNED') && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={() => setAssignTarget(wo)}
            >
              <UserCheck className="h-3.5 w-3.5 me-1" />
              {wo.status === 'ASSIGNED' ? t('workOrders.reassign') : t('workOrders.assign')}
            </Button>
          )}

          {canManageWorkOrders && wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setCancelTarget(wo)}
            >
              <XCircle className="h-3.5 w-3.5 me-1" />
              {t('workOrders.cancel')}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => navigate(`/work-orders/${wo.id}`)}
          >
            <Eye className="h-3.5 w-3.5 me-1" />
            {t('common.view')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isTechnician ? t('workOrders.myWorkOrders') : t('workOrders.title')}
        description={
          isTechnician
            ? t('workOrders.myWorkOrdersDescription')
            : t('workOrders.allWorkOrdersDescription')
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>{t('common.status')}:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            const nextStatus = e.target.value as 'ALL' | WorkOrderStatus;
            setStatusFilter(nextStatus);
            setPage(1);
            const nextParams = new URLSearchParams(searchParams);
            if (nextStatus === 'ALL') {
              nextParams.delete('status');
            } else {
              nextParams.set('status', nextStatus);
            }
            setSearchParams(nextParams, { replace: true });
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">{t('workOrders.allStatuses')}</option>
          {WORK_ORDER_STATUSES.map((status: WorkOrderStatus) => (
            <option key={status} value={status}>
              {enumLabel('status', status)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ms-3">
          <span>{t('workOrders.sourceType')}:</span>
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as 'ALL' | 'REACTIVE' | 'PREVENTIVE');
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">{t('workOrders.allSources')}</option>
          <option value="REACTIVE">{t('workOrders.reactiveOption')}</option>
          <option value="PREVENTIVE">{t('workOrders.preventiveOption')}</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={workOrders}
        rowKey={(wo) => wo.id}
        isLoading={workOrdersQuery.isLoading}
        page={page}
        limit={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyIcon={Wrench}
        emptyTitle={t('workOrders.noWorkOrdersFound')}
        emptyDescription={
          isTechnician
            ? t('workOrders.noWorkOrdersTech')
            : t('workOrders.noWorkOrdersAll')
        }
      />

      <AssignWorkOrderDialog
        workOrder={assignTarget}
        open={Boolean(assignTarget)}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      />

      <CancelWorkOrderDialog
        workOrder={cancelTarget}
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      />

      <CompleteWorkOrderDialog
        workOrder={completeTarget}
        open={Boolean(completeTarget)}
        onOpenChange={(open) => {
          if (!open) setCompleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(startTarget)}
        onOpenChange={(open) => {
          if (!open && !startMutation.isPending) setStartTarget(null);
        }}
        title={t('workOrders.confirmStartTitle')}
        description={
          startTarget
            ? t('workOrders.confirmStartDesc', { number: startTarget.workOrderNumber })
            : t('workOrders.confirmStartDesc', { number: '' })
        }
        confirmLabel={t('workOrders.startWork')}
        cancelLabel={t('common.cancel')}
        isLoading={startMutation.isPending}
        onConfirm={() => {
          if (startTarget) startMutation.mutate(startTarget.id);
        }}
      />
    </div>
  );
}
