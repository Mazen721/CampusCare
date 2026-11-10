import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Star,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PortalLedgerCard } from '@/features/dashboard/PortalLedgerCard';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { TechnicianWorkOrderRow } from '@/features/dashboard/TechnicianWorkOrderRow';
import {
  CompleteWorkOrderDialog,
  type CompleteWorkOrderTarget,
} from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { getErrorMessage } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import type {
  TechnicianDashboard as TechnicianDashboardData,
  TechnicianScheduleItem,
} from '@/types/dashboard';

interface TechnicianDispatchLedgersProps {
  data: TechnicianDashboardData;
}

/**
 * Two-column operational dispatch queues pairing active/overdue orders with
 * assigned upcoming work and inline Start / Complete execution dialogs.
 */
export function TechnicianDispatchLedgers({ data }: TechnicianDispatchLedgersProps) {
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

  const activeAndOverdue = data.schedule
    .filter((wo) => wo.status === 'IN_PROGRESS' || wo.overdue)
    .sort((a, b) => Number(b.overdue) - Number(a.overdue));

  const upcomingAssigned = data.schedule.filter(
    (wo) => wo.status === 'ASSIGNED' && !wo.overdue,
  );

  const hasOverdue = data.counts.overdue > 0;
  const avgResolutionHours = data.analytics?.averageResolutionHours;
  const resolutionLabel =
    avgResolutionHours === null ||
    avgResolutionHours === undefined ||
    (avgResolutionHours === 0 && data.counts.completed === 0)
      ? '—'
      : avgResolutionHours < 0.1
        ? t('dashboard.underTenthHour')
        : t('dashboard.hoursShort', {
            hours: formatNumber(avgResolutionHours, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          });

  const avgRating = data.analytics?.averageRating;
  const feedbackCount = data.analytics?.feedbackCount ?? 0;
  const hasRating = avgRating !== null && avgRating !== undefined;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <PortalLedgerCard
          title={t('dashboard.activeDispatchTitle')}
          description={t('dashboard.activeDispatchDesc')}
          icon={Clock3}
          headerAction={<PortalViewAllLink to="/work-orders" label={t('common.viewAll')} />}
          subHeader={
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/75 pb-3 text-xs">
              <Link
                to="/work-orders"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  hasOverdue
                    ? 'border-destructive/35 bg-destructive/10 font-semibold text-destructive hover:border-destructive'
                    : 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
                )}
              >
                {hasOverdue ? (
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="tabular-nums">
                  {t('dashboard.overdueCountPill', {
                    count: formatNumber(data.counts.overdue),
                  })}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-75 rtl:rotate-180" aria-hidden="true" />
              </Link>
              <span className="tabular-nums text-muted-foreground">
                {t('dashboard.avgResolutionSummary', { value: resolutionLabel })}
              </span>
            </div>
          }
          isEmpty={activeAndOverdue.length === 0}
          emptyTitle={t('dashboard.noActiveDispatchTitle')}
          emptyDescription={t('dashboard.noActiveDispatchDesc')}
          emptyIcon={Clock3}
          emptyAction={{
            label: t('nav.myWorkOrders'),
            to: '/work-orders',
          }}
        >
          <ul className="divide-y divide-border/75">
            {activeAndOverdue.map((workOrder) => (
              <TechnicianWorkOrderRow
                key={workOrder.id}
                workOrder={workOrder}
                showStatusBadge
                onStart={setStartTarget}
                onComplete={setCompleteTarget}
                isStarting={startMutation.isPending}
              />
            ))}
          </ul>
        </PortalLedgerCard>

        <PortalLedgerCard
          title={t('dashboard.upcomingScheduleTitle')}
          description={t('dashboard.upcomingScheduleDesc')}
          icon={CalendarClock}
          headerAction={
            <PortalViewAllLink to="/maintenance/calendar" label={t('dashboard.openCalendar')} />
          }
          subHeader={
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/75 pb-3 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium tabular-nums',
                  hasRating
                    ? 'border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] font-semibold text-[hsl(var(--mnu-navy))]'
                    : 'border-border bg-secondary text-secondary-foreground',
                )}
              >
                <Star
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    hasRating
                      ? 'fill-[hsl(var(--mnu-gold-ink))] text-[hsl(var(--mnu-gold-ink))]'
                      : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                {hasRating ? (
                  <>
                    <span>
                      {t('dashboard.ratingSummaryPill', {
                        rating: formatNumber(avgRating, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }),
                      })}
                    </span>
                    <span className="font-normal text-muted-foreground">
                      {t('dashboard.reviewsCount', {
                        count: feedbackCount,
                      })}
                    </span>
                  </>
                ) : (
                  <span>{t('dashboard.noRatingYet')}</span>
                )}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {t('dashboard.readyToStartCount', {
                  count: formatNumber(upcomingAssigned.length),
                })}
              </span>
            </div>
          }
          isEmpty={upcomingAssigned.length === 0}
          emptyTitle={t('dashboard.noUpcomingScheduleTitle')}
          emptyDescription={t('dashboard.noUpcomingScheduleDesc')}
          emptyIcon={CalendarClock}
          emptyAction={{
            label: t('dashboard.openCalendar'),
            to: '/maintenance/calendar',
          }}
        >
          <ul className="divide-y divide-border/75">
            {upcomingAssigned.map((workOrder) => (
              <TechnicianWorkOrderRow
                key={workOrder.id}
                workOrder={workOrder}
                onStart={setStartTarget}
                onComplete={setCompleteTarget}
                isStarting={startMutation.isPending}
              />
            ))}
          </ul>
        </PortalLedgerCard>
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
