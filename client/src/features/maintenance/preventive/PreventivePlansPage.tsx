import { CalendarClock, Pencil, Plus, Power, Repeat2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PreventivePlanFormDialog } from '@/features/maintenance/preventive/PreventivePlanFormDialog';
import { preventiveApi } from '@/features/maintenance/preventive/preventiveApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  RECURRENCE_LABELS,
  type PreventivePlanRecord,
} from '@/types/preventive';

const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function PreventivePlansPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'MAINTENANCE_MANAGER';

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PreventivePlanRecord | null>(null);
  const [statusPlan, setStatusPlan] = useState<PreventivePlanRecord | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const plansQuery = useQuery({
    queryKey: ['preventive-plans', { statusFilter, page }],
    queryFn: () =>
      preventiveApi.list({
        isActive:
          statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page,
        limit: PAGE_SIZE,
      }),
  });

  const generateMutation = useMutation({
    mutationFn: () => preventiveApi.generateDue(),
    onSuccess: async ({ created }) => {
      await queryClient.invalidateQueries({ queryKey: ['preventive-plans'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        created === 0
          ? 'No preventive plans are due right now'
          : `${created} preventive work order${created === 1 ? '' : 's'} created`,
      );
      setGenerateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to generate preventive work orders',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: (plan: PreventivePlanRecord) =>
      preventiveApi.updateStatus(plan.id, !plan.isActive),
    onSuccess: async (response, plan) => {
      await queryClient.invalidateQueries({ queryKey: ['preventive-plans'] });
      toast.success(
        `${response.plan.title} ${plan.isActive ? 'deactivated' : 'activated'}`,
      );
      setStatusPlan(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to update the preventive plan',
      );
    },
  });

  const plans = plansQuery.data?.data ?? [];
  const total = plansQuery.data?.total ?? 0;

  const columns: Array<DataTableColumn<PreventivePlanRecord>> = [
    {
      id: 'plan',
      header: 'Plan',
      cell: (plan) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate text-sm font-medium text-foreground">{plan.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {plan.category}
            </Badge>
            <PriorityBadge priority={plan.priority} />
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      header: 'Schedule',
      cell: (plan) => (
        <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            {plan.recurrenceType === 'CUSTOM_DAYS'
              ? `Every ${plan.recurrenceIntervalDays ?? '—'} days`
              : RECURRENCE_LABELS[plan.recurrenceType]}
          </p>
          <p>
            Next: {formatDate(plan.nextScheduledDate)}
            {plan.overdue ? (
              <span className="ms-1.5 inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                <TriangleAlert className="h-2.5 w-2.5" aria-hidden="true" />
                Due
              </span>
            ) : null}
          </p>
          {plan.lastGeneratedDate ? (
            <p>Last generated: {formatDate(plan.lastGeneratedDate)}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: (plan) =>
        plan.location ? (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{plan.location.buildingName}</p>
            <p>
              {plan.location.floor} · {plan.location.room}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'technician',
      header: 'Technician',
      cell: (plan) => (
        <span className="text-xs text-muted-foreground">
          {plan.assignedTechnician?.name ? (
            <bdi>{plan.assignedTechnician.name}</bdi>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (plan) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {plan.expectedDurationHours} h
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (plan) => (
        <Badge
          variant="outline"
          className={
            plan.isActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-stone-300 bg-stone-100 text-stone-700'
          }
        >
          {plan.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (plan) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${plan.title}`}
            onClick={() => {
              setEditingPlan(plan);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${plan.isActive ? 'Deactivate' : 'Activate'} ${plan.title}`}
            onClick={() => setStatusPlan(plan)}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    });
  }

  const errorMessage =
    plansQuery.error instanceof ApiError
      ? plansQuery.error.message
      : plansQuery.error
        ? 'Unable to load preventive plans right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preventive maintenance"
        title="Preventive plans"
        description={
          canManage
            ? 'Create recurring maintenance plans and generate due work orders manually. Nothing runs automatically.'
            : 'Read-only view of recurring maintenance plans. Only maintenance managers can change them.'
        }
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Generate due work orders
              </Button>
              <Button
                onClick={() => {
                  setEditingPlan(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New plan
              </Button>
            </>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={plans}
        rowKey={(plan) => plan.id}
        isLoading={plansQuery.isLoading}
        error={errorMessage}
        onRetry={() => void plansQuery.refetch()}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All plans', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
            onChange: (value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            },
          },
        ]}
        page={page}
        limit={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyTitle="No preventive plans"
        emptyDescription="Recurring maintenance plans will appear here once they are created."
        emptyIcon={Repeat2}
      />

      <PreventivePlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editingPlan}
      />

      <ConfirmDialog
        open={Boolean(statusPlan)}
        onOpenChange={(open) => !open && setStatusPlan(null)}
        title={statusPlan?.isActive ? 'Deactivate this plan?' : 'Activate this plan?'}
        description={
          statusPlan?.isActive
            ? `"${statusPlan.title}" will stop generating work orders until it is activated again.`
            : `"${statusPlan?.title ?? 'This plan'}" will become eligible for Generate due work orders again.`
        }
        confirmLabel={statusPlan?.isActive ? 'Deactivate' : 'Activate'}
        tone={statusPlan?.isActive ? 'destructive' : 'default'}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (statusPlan) statusMutation.mutate(statusPlan);
        }}
      />

      <ConfirmDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Generate due work orders?"
        description="One work order will be created for every active plan whose next scheduled date has passed. Missed occurrences are skipped, not backfilled."
        confirmLabel="Generate"
        isLoading={generateMutation.isPending}
        onConfirm={() => generateMutation.mutate()}
      />
    </div>
  );
}
