import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { humanizeEnum } from '@/lib/labels';
import { WORK_ORDER_STATUSES, type WorkOrderStatus } from '@/types/meta';
import type { TechnicianRecord } from '@/types/technicians';

export type CalendarView = 'month' | 'week';

interface CalendarToolbarProps {
  view: CalendarView;
  anchor: Date;
  status: 'ALL' | WorkOrderStatus;
  technicianId: string;
  technicians: TechnicianRecord[];
  canFilterTechnicians: boolean;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onStatusChange: (status: 'ALL' | WorkOrderStatus) => void;
  onTechnicianChange: (technicianId: string) => void;
}

export function CalendarToolbar({
  view,
  anchor,
  status,
  technicianId,
  technicians,
  canFilterTechnicians,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onStatusChange,
  onTechnicianChange,
}: CalendarToolbarProps) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  const rangeLabel =
    view === 'month'
      ? format(anchor, 'MMMM yyyy')
      : `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 shadow-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border bg-background p-0.5">
            {(['month', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onViewChange(option)}
                aria-pressed={view === option}
                className={
                  view === option
                    ? 'rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                    : 'rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {option === 'month' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onPrevious}
              aria-label={`Previous ${view}`}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onNext}
              aria-label={`Next ${view}`}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>

          <p className="flex items-center gap-1.5 px-1 text-sm font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            {rangeLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
          </div>

          {canFilterTechnicians ? (
            <label className="sr-only" htmlFor="calendar-technician">
              Filter by technician
            </label>
          ) : null}
          {canFilterTechnicians ? (
            <select
              id="calendar-technician"
              value={technicianId}
              onChange={(event) => onTechnicianChange(event.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All technicians</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name}
                </option>
              ))}
            </select>
          ) : null}

          <label className="sr-only" htmlFor="calendar-status">
            Filter by status
          </label>
          <select
            id="calendar-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as 'ALL' | WorkOrderStatus)
            }
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">All statuses</option>
            {WORK_ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {humanizeEnum(option)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
