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
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { AssignWorkOrderDialog } from '@/features/maintenance/work-orders/AssignWorkOrderDialog';
import { CancelWorkOrderDialog } from '@/features/maintenance/work-orders/CancelWorkOrderDialog';
import { CompleteWorkOrderDialog } from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { formatDate } from '@/lib/utils';
import { WORK_ORDER_STATUSES, type WorkOrderStatus } from '@/types/meta';
import type { WorkOrderRecord } from '@/types/workOrders';

const PAGE_SIZE = 10;

export function WorkOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'REACTIVE' | 'PREVENTIVE'>('ALL');

  const [assignTarget, setAssignTarget] = useState<WorkOrderRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<WorkOrderRecord | null>(null);
  const [completeTarget, setCompleteTarget] = useState<WorkOrderRecord | null>(null);

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
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order marked as in progress');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Unable to start work order');
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
      header: 'Work Order',
      cell: (wo) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/work-orders/${wo.id}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              {wo.workOrderNumber}
            </Link>
            <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
              {wo.sourceType}
            </Badge>
          </div>
          <p className="truncate text-xs font-medium text-foreground max-w-[240px]">
            {wo.title}
          </p>
          <span className="text-[11px] text-muted-foreground">{wo.category}</span>
        </div>
      ),
    },
    {
      id: 'priorityStatus',
      header: 'Status & Priority',
      cell: (wo) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={wo.status as any} />
          <PriorityBadge priority={wo.priority} />
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: (wo) => (
        <div className="text-xs text-muted-foreground">
          {wo.location ? (
            <>
              <p className="font-medium text-foreground">{wo.location.buildingName}</p>
              <p className="text-[11px]">
                Floor {wo.location.floor} · Room {wo.location.room}
              </p>
            </>
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
            header: 'Technician',
            cell: (wo: WorkOrderRecord) => (
              <div className="text-xs">
                {wo.assignedTechnician ? (
                  <span className="font-medium text-foreground">
                    {wo.assignedTechnician.name}
                  </span>
                ) : (
                  <span className="text-amber-600 italic">Unassigned</span>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'schedule',
      header: 'Due / Status',
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
              <span className="text-muted-foreground">Unscheduled</span>
            )}
            {overdue && <span className="text-[10px] text-destructive uppercase tracking-wider block">Overdue</span>}
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
              className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => startMutation.mutate(wo.id)}
              disabled={startMutation.isPending}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Start
            </Button>
          )}

          {isTechnician && wo.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setCompleteTarget(wo)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Complete
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
              <UserCheck className="h-3.5 w-3.5 mr-1" />
              {wo.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}
            </Button>
          )}

          {canManageWorkOrders && wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setCancelTarget(wo)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => navigate(`/work-orders/${wo.id}`)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isTechnician ? 'My Work Orders' : 'Work Orders'}
        description={
          isTechnician
            ? 'Track your assigned work orders, update task progress, and log resolutions.'
            : 'Supervise maintenance execution, assign technicians, and track active work orders.'
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Status:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          {WORK_ORDER_STATUSES.map((status: WorkOrderStatus) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-3">
          <span>Source:</span>
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as any);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">All Sources</option>
          <option value="REACTIVE">Reactive (Requests)</option>
          <option value="PREVENTIVE">Preventive (Plans)</option>
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
        emptyTitle="No work orders found"
        emptyDescription={
          isTechnician
            ? 'You currently have no work orders matching this filter.'
            : 'No work orders match the selected filters.'
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
    </div>
  );
}
