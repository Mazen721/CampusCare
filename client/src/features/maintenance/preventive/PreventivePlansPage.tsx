import { CalendarClock, Pencil, Plus, Power, Repeat2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import type { PreventivePlanRecord } from '@/types/preventive';

const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function PreventivePlansPage() {
  const { t } = useTranslation();
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
          ? t('preventive.noPlansFound')
          : t('preventive.generatedSuccess'),
      );
      setGenerateOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (plan: PreventivePlanRecord) =>
      preventiveApi.updateStatus(plan.id, !plan.isActive),
    onSuccess: async (response, plan) => {
      await queryClient.invalidateQueries({ queryKey: ['preventive-plans'] });
      toast.success(
        `${tr(response.plan, 'title')} ${plan.isActive ? t('common.inactive') : t('common.active')}`,
      );
      setStatusPlan(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const plans = plansQuery.data?.data ?? [];
  const total = plansQuery.data?.total ?? 0;

  const columns: Array<DataTableColumn<PreventivePlanRecord>> = [
    {
      id: 'plan',
      header: t('preventive.planTitle'),
      cell: (plan) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate text-sm font-medium text-foreground">{tr(plan, 'title')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {enumLabel('maintenanceCategory', plan.category)}
            </Badge>
            <PriorityBadge priority={plan.priority} />
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      header: t('preventive.recurrence'),
      cell: (plan) => (
        <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            {plan.recurrenceType === 'CUSTOM_DAYS'
              ? t('preventive.everyDays', { days: plan.recurrenceIntervalDays ?? '—' })
              : enumLabel('recurrence', plan.recurrenceType)}
          </p>
          <p>
            {t('preventive.nextScheduledDate')}: {formatDate(plan.nextScheduledDate)}
            {plan.overdue ? (
              <span className="ms-1.5 inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                <TriangleAlert className="h-2.5 w-2.5" aria-hidden="true" />
                {t('preventive.due')}
              </span>
            ) : null}
          </p>
          {plan.lastGeneratedDate ? (
            <p>{t('preventive.lastGeneratedDate')}: {formatDate(plan.lastGeneratedDate)}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'location',
      header: t('common.location'),
      cell: (plan) =>
        plan.location ? (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{tr(plan.location, 'buildingName')}</p>
            <p>
              {tr(plan.location, 'floor')} · {tr(plan.location, 'room')}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'technician',
      header: t('workOrders.technician'),
      cell: (plan) => (
        <span className="text-xs text-muted-foreground">
          {plan.assignedTechnician ? (
            <bdi>{tr(plan.assignedTechnician, 'name')}</bdi>
          ) : (
            <span className="italic">{t('workOrders.unassigned')}</span>
          )}
        </span>
      ),
    },
    {
      id: 'duration',
      header: t('preventive.expectedDurationHours'),
      cell: (plan) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {plan.expectedDurationHours} {t('dashboard.hoursShort', { hours: '' }).trim()}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (plan) => (
        <Badge
          variant="outline"
          className={
            plan.isActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-stone-300 bg-stone-100 text-stone-700'
          }
        >
          {plan.isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (plan) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${t('common.edit')} ${tr(plan, 'title')}`}
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
            aria-label={`${plan.isActive ? t('common.inactive') : t('common.active')} ${tr(plan, 'title')}`}
            onClick={() => setStatusPlan(plan)}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    });
  }

  const errorMessage = plansQuery.error ? getErrorMessage(plansQuery.error, t('errors.network')) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('preventive.title')}
        title={t('preventive.title')}
        description={
          canManage
            ? t('preventive.managerDesc')
            : t('preventive.readOnlyDesc')
        }
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                {t('preventive.generateDueButton')}
              </Button>
              <Button
                onClick={() => {
                  setEditingPlan(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('preventive.createPlan')}
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
            label: t('common.status'),
            value: statusFilter,
            options: [
              { label: t('common.all'), value: 'ALL' },
              { label: t('common.active'), value: 'ACTIVE' },
              { label: t('common.inactive'), value: 'INACTIVE' },
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
        emptyTitle={t('preventive.noPlansFound')}
        emptyDescription={t('preventive.noPlansFound')}
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
        title={statusPlan?.isActive ? t('common.inactive') : t('common.active')}
        description={statusPlan ? `"${tr(statusPlan, 'title')}"` : ''}
        confirmLabel={statusPlan?.isActive ? t('common.inactive') : t('common.active')}
        cancelLabel={t('common.cancel')}
        tone={statusPlan?.isActive ? 'destructive' : 'default'}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (statusPlan) statusMutation.mutate(statusPlan);
        }}
      />

      <ConfirmDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title={t('preventive.generateDueButton')}
        description={t('preventive.managerDesc')}
        confirmLabel={t('preventive.generateNow')}
        cancelLabel={t('common.cancel')}
        isLoading={generateMutation.isPending}
        onConfirm={() => generateMutation.mutate()}
      />
    </div>
  );
}
