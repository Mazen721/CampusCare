import { endOfDay, format, startOfDay } from 'date-fns';
import type { CalendarWorkOrder } from '@/types/calendar';

export function workOrdersForDay(
  workOrders: CalendarWorkOrder[],
  day: Date,
): CalendarWorkOrder[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();

  return workOrders.filter((workOrder) => {
    if (!workOrder.scheduledStart || !workOrder.expectedCompletion) return false;

    const start = new Date(workOrder.scheduledStart).getTime();
    const end = new Date(workOrder.expectedCompletion).getTime();
    return start <= dayEnd && end >= dayStart;
  });
}

export function formatWorkOrderTime(workOrder: CalendarWorkOrder): string {
  if (!workOrder.scheduledStart || !workOrder.expectedCompletion) return 'Unscheduled';

  const start = new Date(workOrder.scheduledStart);
  const end = new Date(workOrder.expectedCompletion);
  return `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`;
}
