import {
  Building2,
  CheckCircle2,
  DoorOpen,
  Play,
  Star,
  TriangleAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  formatTechnicianResolutionHours,
  formatTechnicianTargetTime,
  getTechnicianLocationParts,
} from '@/features/dashboard/technicianHelpers';
import { tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { cn, formatNumber } from '@/lib/utils';
import type {
  TechnicianDashboard as TechnicianDashboardData,
  TechnicianScheduleItem,
} from '@/types/dashboard';

interface TechnicianSummaryGridProps {
  counts: TechnicianDashboardData['counts'];
  analytics: TechnicianDashboardData['analytics'];
  spotlightTask: TechnicianScheduleItem | null;
  onStart: (workOrder: TechnicianScheduleItem) => void;
  onComplete: (workOrder: TechnicianScheduleItem) => void;
  isStarting?: boolean;
}

/**
 * Row 1 of the Technician field workbench: a 7-column Current Priority Task Spotlight
 * paired with a calm 5-column 3-stat Simple Shift Summary card.
 */
export function TechnicianSummaryGrid({
  counts,
  analytics,
  spotlightTask,
  onStart,
  onComplete,
  isStarting = false,
}: TechnicianSummaryGridProps) {
  const { t } = useTranslation();

  const resolutionLabel = formatTechnicianResolutionHours(
    analytics?.averageResolutionHours,
    counts.completed,
    t,
  );
  const avgRating = analytics?.averageRating;
  const hasRating = avgRating !== null && avgRating !== undefined;
  const ratingLabel = hasRating
    ? formatNumber(avgRating, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : t('dashboard.noRatingYet');

  const locationParts = spotlightTask
    ? getTechnicianLocationParts(spotlightTask.location, t('dashboard.locationUnassigned'))
    : null;

  return (
    <section aria-label={t('nav.groupOverview')} className="grid gap-6 lg:grid-cols-12">
      <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-6 lg:col-span-7">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 top-0 h-[3px]',
            spotlightTask?.overdue ? 'bg-destructive' : 'bg-primary',
          )}
        />

        {spotlightTask && locationParts ? (
          <>
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                    spotlightTask.overdue
                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-amber-500/40 bg-amber-500/[0.12] text-amber-900',
                  )}
                >
                  {spotlightTask.overdue ? (
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                  )}
                  <span>
                    {spotlightTask.overdue
                      ? t('dashboard.overduePriorityTask')
                      : t('dashboard.currentPriorityTask')}
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  <StatusBadge status={spotlightTask.status} />
                  <span
                    dir="ltr"
                    className="font-mono text-xs font-semibold text-muted-foreground tabular-nums"
                  >
                    {spotlightTask.workOrderNumber}
                  </span>
                </div>
              </div>

              <h2 dir="auto" className="text-lg font-bold leading-snug text-foreground">
                {tr(spotlightTask, 'title')}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-secondary/55 px-4 py-3 text-xs text-foreground">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Building2 className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                  <bdi>{locationParts.building}</bdi>
                </span>

                {locationParts.floorRoom ? (
                  <>
                    <span aria-hidden="true" className="text-border">
                      |
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      <DoorOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <bdi>{locationParts.floorRoom}</bdi>
                    </span>
                  </>
                ) : null}

                <span aria-hidden="true" className="text-border">
                  |
                </span>
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <bdi>{enumLabel('maintenanceCategory', spotlightTask.category)}</bdi>
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/75 pt-4">
              <span
                className={cn(
                  'text-xs tabular-nums',
                  spotlightTask.overdue
                    ? 'font-semibold text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {formatTechnicianTargetTime(spotlightTask, t)}
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-border/80 bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-secondary/60"
                >
                  <Link to={`/work-orders/${spotlightTask.id}`}>
                    {t('dashboard.viewDetails')}
                  </Link>
                </Button>

                {spotlightTask.status === 'IN_PROGRESS' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onComplete(spotlightTask)}
                    className="h-9 gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('dashboard.completeTask')}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isStarting}
                    onClick={() => onStart(spotlightTask)}
                    className="h-9 gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))]"
                  >
                    <Play className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
                    <span>{t('dashboard.technicianStartWork')}</span>
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title={t('dashboard.noActiveOrders')}
            description={t('dashboard.noActiveOrdersDesc')}
            className="min-h-[210px] flex-1 border-0 bg-transparent px-4 py-6"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/work-orders">{t('nav.myWorkOrders')}</Link>
              </Button>
            }
          />
        )}
      </article>

      <article className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 lg:col-span-5">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {t('dashboard.simpleShiftSummaryTitle')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('dashboard.simpleShiftSummaryDesc')}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Link
              to="/work-orders?status=IN_PROGRESS"
              className="rounded-xl bg-secondary/55 p-3.5 transition-colors hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-2xl font-bold leading-none text-foreground tabular-nums">
                {formatNumber(counts.inProgress)}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {enumLabel('status', 'IN_PROGRESS')}
              </p>
            </Link>

            <Link
              to="/work-orders?status=ASSIGNED"
              className="rounded-xl bg-secondary/55 p-3.5 transition-colors hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-2xl font-bold leading-none text-amber-800 tabular-nums">
                {formatNumber(counts.assigned)}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {enumLabel('status', 'ASSIGNED')}
              </p>
            </Link>

            <Link
              to="/work-orders?status=COMPLETED"
              className="rounded-xl bg-emerald-500/[0.08] p-3.5 transition-colors hover:bg-emerald-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-2xl font-bold leading-none text-emerald-700 tabular-nums">
                {formatNumber(counts.completed)}
              </p>
              <p className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-emerald-800">
                <span>{enumLabel('status', 'COMPLETED')}</span>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/55 px-4 py-3 text-xs">
          <span className="font-medium text-muted-foreground">
            {t('dashboard.avgResolutionAndRating')}
          </span>
          <span className="inline-flex items-center gap-2 font-bold text-foreground tabular-nums">
            <span>{resolutionLabel}</span>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Star
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  hasRating ? 'fill-amber-500 text-amber-600' : 'text-muted-foreground',
                )}
                aria-hidden="true"
              />
              <span>{ratingLabel}</span>
            </span>
          </span>
        </div>
      </article>
    </section>
  );
}
