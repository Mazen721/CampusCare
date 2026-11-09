import { useTranslation } from 'react-i18next';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarWorkOrderChip } from '@/features/maintenance/calendar/CalendarWorkOrderChip';
import { workOrdersForDay } from '@/features/maintenance/calendar/calendar.utils';
import { cn } from '@/lib/utils';
import type { CalendarWorkOrder } from '@/types/calendar';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_VISIBLE_ITEMS = 2;

interface CalendarMonthViewProps {
  anchor: Date;
  workOrders: CalendarWorkOrder[];
}

export function CalendarMonthView({ anchor, workOrders }: CalendarMonthViewProps) {
  const { t } = useTranslation();
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-panel">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayItems = workOrdersForDay(workOrders, day);
            const visibleItems = dayItems.slice(0, MAX_VISIBLE_ITEMS);
            const hiddenCount = dayItems.length - visibleItems.length;
            const inMonth = isSameMonth(day, anchor);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[124px] border-b border-e p-1.5 last:border-e-0',
                  !inMonth && 'bg-muted/25',
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                      isToday(day)
                        ? 'bg-primary text-primary-foreground'
                        : inMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayItems.length > 0 ? (
                    <span className="text-[10px] text-muted-foreground">
                      {dayItems.length}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  {visibleItems.map((workOrder) => (
                    <CalendarWorkOrderChip
                      key={`${workOrder.id}-${day.toISOString()}`}
                      workOrder={workOrder}
                      compact
                    />
                  ))}
                  {hiddenCount > 0 ? (
                    <p className="px-1 text-[10px] font-medium text-muted-foreground">
                      {t('calendar.moreItems', { count: hiddenCount })}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
