import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from 'date-fns';
import { CalendarWorkOrderChip } from '@/features/maintenance/calendar/CalendarWorkOrderChip';
import { workOrdersForDay } from '@/features/maintenance/calendar/calendar.utils';
import { cn } from '@/lib/utils';
import type { CalendarWorkOrder } from '@/types/calendar';

interface CalendarWeekViewProps {
  anchor: Date;
  workOrders: CalendarWorkOrder[];
  showTechnician: boolean;
}

export function CalendarWeekView({
  anchor,
  workOrders,
  showTechnician,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-panel">
      <div className="grid min-w-[980px] grid-cols-7">
        {days.map((day) => {
          const dayItems = workOrdersForDay(workOrders, day);

          return (
            <div
              key={day.toISOString()}
              className="min-h-[420px] border-e last:border-e-0"
            >
              <div
                className={cn(
                  'border-b px-2 py-2 text-center',
                  isToday(day) ? 'bg-primary/10' : 'bg-muted/40',
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-sm font-semibold',
                    isToday(day) ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {format(day, 'd MMM')}
                </p>
              </div>

              <div className="space-y-1.5 p-1.5">
                {dayItems.length === 0 ? (
                  <p className="rounded-md border border-dashed px-2 py-3 text-center text-[10px] text-muted-foreground">
                    No work
                  </p>
                ) : (
                  dayItems.map((workOrder) => (
                    <CalendarWorkOrderChip
                      key={`${workOrder.id}-${day.toISOString()}`}
                      workOrder={workOrder}
                      showTechnician={showTechnician}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
