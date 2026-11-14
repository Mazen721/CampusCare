import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TechnicianDispatchLedgers } from '@/features/dashboard/TechnicianDispatchLedgers';
import { TechnicianSummaryGrid } from '@/features/dashboard/TechnicianSummaryGrid';
import { selectTechnicianTasks } from '@/features/dashboard/technicianHelpers';
import {
  CompleteWorkOrderDialog,
  type CompleteWorkOrderTarget,
} from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { getErrorMessage } from '@/lib/api';
import type {
  TechnicianDashboard as TechnicianDashboardData,
  TechnicianScheduleItem,
} from '@/types/dashboard';

/**
 * Relaxed, task-first field workbench for maintenance technicians pairing a
 * Current Priority Task Spotlight + Simple Shift Summary with a 3-column remaining tasks grid.
 */
export function TechnicianDashboard({ data }: { data: TechnicianDashboardData }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [startTarget, setStartTarget] = useState<TechnicianScheduleItem | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CompleteWorkOrderTarget | null>(null);

  const startMutation = useMutation({
    mutationFn: (id: string) => workOrdersApi.start(id),
    onSuccess: async () => {
      setStartTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
      ]);
      toast.success(t('workOrders.workOrderStartedSuccess'));
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, t('errors.network')));
    },
  });

  const { spotlightTask, remainingTasks } = selectTechnicianTasks(data.schedule);

  return (
    <>
      <div className="space-y-7">
        <TechnicianSummaryGrid
          counts={data.counts}
          analytics={data.analytics}
          spotlightTask={spotlightTask}
          onStart={setStartTarget}
          onComplete={setCompleteTarget}
          isStarting={startMutation.isPending}
        />
        <TechnicianDispatchLedgers
          tasks={remainingTasks}
          hasSpotlight={Boolean(spotlightTask)}
          onStart={setStartTarget}
          onComplete={setCompleteTarget}
          isStarting={startMutation.isPending}
        />
      </div>

      <ConfirmDialog
        open={Boolean(startTarget)}
        onOpenChange={(open) => {
          if (!open && !startMutation.isPending) {
            setStartTarget(null);
          }
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
          if (startTarget) {
            startMutation.mutate(startTarget.id);
          }
        }}
      />

      <CompleteWorkOrderDialog
        workOrder={completeTarget}
        open={Boolean(completeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteTarget(null);
          }
        }}
      />
    </>
  );
}
