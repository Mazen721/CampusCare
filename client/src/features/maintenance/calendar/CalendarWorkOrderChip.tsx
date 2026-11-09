import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatWorkOrderTime } from '@/features/maintenance/calendar/calendar.utils';
import { formatLocation, tr } from '@/i18n/localize';
import { cn } from '@/lib/utils';
import type { CalendarWorkOrder } from '@/types/calendar';

interface CalendarWorkOrderChipProps {
  workOrder: CalendarWorkOrder;
  compact?: boolean;
  showTechnician?: boolean;
}

export function CalendarWorkOrderChip({
  workOrder,
  compact = false,
  showTechnician = false,
}: CalendarWorkOrderChipProps) {
  return (
    <Link
      to={`/work-orders/${workOrder.id}`}
      className={cn(
        'block rounded-md border px-2 py-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        workOrder.overdue
          ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
      )}
    >
      <span className="flex items-start gap-1.5">
        {workOrder.overdue ? (
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        ) : null}
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold leading-tight">
            {tr(workOrder, 'title')}
          </span>
          <span
            className={cn(
              'mt-0.5 block truncate text-[10px]',
              workOrder.overdue ? 'text-destructive/80' : 'text-muted-foreground',
            )}
          >
            {formatWorkOrderTime(workOrder)}
            {showTechnician && workOrder.assignedTechnician ? (
              <>
                {' · '}
                <bdi>{workOrder.assignedTechnician.name}</bdi>
              </>
            ) : null}
          </span>
          {!compact && workOrder.location ? (
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {formatLocation(workOrder.location)}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
