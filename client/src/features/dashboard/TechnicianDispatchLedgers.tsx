import { CalendarClock, CheckCircle2, MapPin, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import {
  formatTechnicianTargetTime,
  getTechnicianLocationParts,
} from '@/features/dashboard/technicianHelpers';
import { tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { TechnicianScheduleItem } from '@/types/dashboard';

interface TechnicianDispatchLedgersProps {
  tasks: TechnicianScheduleItem[];
  hasSpotlight: boolean;
  onStart: (workOrder: TechnicianScheduleItem) => void;
  onComplete: (workOrder: TechnicianScheduleItem) => void;
  isStarting?: boolean;
}

function RemainingTaskCard({
  workOrder,
  onStart,
  onComplete,
  isStarting,
}: {
  workOrder: TechnicianScheduleItem;
  onStart: (workOrder: TechnicianScheduleItem) => void;
  onComplete: (workOrder: TechnicianScheduleItem) => void;
  isStarting: boolean;
}) {
  const { t } = useTranslation();
  const locationParts = getTechnicianLocationParts(
    workOrder.location,
    t('dashboard.locationUnassigned'),
  );

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/35">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            dir="ltr"
            className="font-mono font-semibold text-muted-foreground tabular-nums"
          >
            {workOrder.workOrderNumber}
          </span>
          <StatusBadge status={workOrder.overdue ? 'OVERDUE' : workOrder.status} />
        </div>

        <Link
          to={`/work-orders/${workOrder.id}`}
          dir="auto"
          className="line-clamp-2 block rounded-sm text-sm font-bold leading-snug text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {tr(workOrder, 'title')}
        </Link>

        <div className="space-y-1 rounded-xl bg-secondary/55 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            <bdi className="truncate">{locationParts.building}</bdi>
          </p>
          <p className="ps-5 text-[11.5px] text-muted-foreground">
            <bdi>
              {locationParts.floorRoom ?? enumLabel('maintenanceCategory', workOrder.category)}
            </bdi>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-border/75 pt-3.5 text-xs">
        <span
          className={cn(
            'font-medium tabular-nums',
            workOrder.overdue ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {formatTechnicianTargetTime(workOrder, t)}
        </span>

        {workOrder.status === 'IN_PROGRESS' ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onComplete(workOrder)}
            className="h-8 gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t('dashboard.markComplete')}</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={isStarting}
            onClick={() => onStart(workOrder)}
            className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))]"
          >
            <Play className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" aria-hidden="true" />
            <span>{t('dashboard.technicianStartWork')}</span>
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * Row 2 of the Technician field workbench: a spacious 3-column grid of remaining
 * scheduled work orders with inline Start Work and Mark Complete triggers.
 */
export function TechnicianDispatchLedgers({
  tasks,
  hasSpotlight,
  onStart,
  onComplete,
  isStarting = false,
}: TechnicianDispatchLedgersProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('dashboard.remainingTasksTitle')} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
            {t('dashboard.remainingTasksTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('dashboard.remainingTasksHint')}
          </p>
        </div>

        <PortalViewAllLink to="/maintenance/calendar" label={t('dashboard.openCalendar')} />
      </div>

      {tasks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {tasks.map((workOrder) => (
            <RemainingTaskCard
              key={workOrder.id}
              workOrder={workOrder}
              onStart={onStart}
              onComplete={onComplete}
              isStarting={isStarting}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title={
            hasSpotlight
              ? t('dashboard.noRemainingTasksTitle')
              : t('dashboard.noUpcomingScheduleTitle')
          }
          description={
            hasSpotlight
              ? t('dashboard.noRemainingTasksDesc')
              : t('dashboard.noUpcomingScheduleDesc')
          }
          className="min-h-[168px] rounded-2xl border-border/80 bg-card/70"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/maintenance/calendar">{t('dashboard.openCalendar')}</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
