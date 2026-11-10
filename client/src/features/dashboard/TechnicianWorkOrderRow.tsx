import type { TFunction } from 'i18next';
import { CheckCircle2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLocation, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { cn, formatDate } from '@/lib/utils';
import type { TechnicianScheduleItem } from '@/types/dashboard';

interface TechnicianWorkOrderRowProps {
  workOrder: TechnicianScheduleItem;
  showStatusBadge?: boolean;
  onStart: (workOrder: TechnicianScheduleItem) => void;
  onComplete: (workOrder: TechnicianScheduleItem) => void;
  isStarting?: boolean;
}

function formatScheduleText(
  workOrder: TechnicianScheduleItem,
  t: TFunction,
): string {
  const dateOpts: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };

  if (workOrder.overdue && workOrder.expectedCompletion) {
    return t('dashboard.dueByLabel', {
      date: formatDate(workOrder.expectedCompletion, dateOpts),
    });
  }

  if (workOrder.scheduledStart && workOrder.expectedCompletion) {
    return t('dashboard.scheduledWindow', {
      start: formatDate(workOrder.scheduledStart, dateOpts),
      end: formatDate(workOrder.expectedCompletion, dateOpts),
    });
  }

  if (workOrder.scheduledStart) {
    return `${t('workOrders.scheduledStart')} ${formatDate(workOrder.scheduledStart, dateOpts)}`;
  }

  return t('workOrders.notScheduled');
}

/**
 * Flat single-elevation work-order dispatch row with mixed-script title wrapping
 * and sibling Start / Complete controls (no nested interactive elements).
 */
export function TechnicianWorkOrderRow({
  workOrder,
  showStatusBadge = false,
  onStart,
  onComplete,
  isStarting = false,
}: TechnicianWorkOrderRowProps) {
  const { t } = useTranslation();
  const locationText = workOrder.location ? formatLocation(workOrder.location) : null;
  const scheduleText = formatScheduleText(workOrder, t);

  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <div className="group -mx-2 flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/45">
        <div className="min-w-0 space-y-1">
          <Link
            to={`/work-orders/${workOrder.id}`}
            dir="auto"
            className="line-clamp-2 rounded-sm text-start text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tr(workOrder, 'title')}
          </Link>

          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span dir="ltr" className="font-mono tabular-nums">
              {workOrder.workOrderNumber}
            </span>
            <span aria-hidden="true">·</span>
            <bdi>{enumLabel('maintenanceCategory', workOrder.category)}</bdi>
            {locationText ? (
              <>
                <span aria-hidden="true">·</span>
                <bdi>{locationText}</bdi>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <p
            className={cn(
              'text-xs tabular-nums',
              workOrder.overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
            )}
          >
            {scheduleText}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {workOrder.overdue ? (
              <Badge
                variant="destructive"
                className="shrink-0 font-semibold ltr:uppercase ltr:tracking-wide"
              >
                {t('common.overdue')}
              </Badge>
            ) : null}
            <PriorityBadge priority={workOrder.priority} />
            {showStatusBadge ? <StatusBadge status={workOrder.status} /> : null}

            {workOrder.status === 'IN_PROGRESS' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onComplete(workOrder)}
                className="h-8 gap-1.5 bg-[hsl(var(--mnu-navy))] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('workOrders.complete')}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isStarting}
                onClick={() => onStart(workOrder)}
                className="h-8 gap-1.5 border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm hover:border-[hsl(var(--mnu-gold))] hover:bg-[hsl(var(--mnu-gold-tint))] hover:text-[hsl(var(--mnu-navy))]"
              >
                <Play
                  className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--mnu-gold-ink))] rtl:rotate-180"
                  aria-hidden="true"
                />
                <span>{t('workOrders.start')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
