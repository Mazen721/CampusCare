import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { calendarApi } from '@/features/maintenance/calendar/calendarApi';
import { CalendarMonthView } from '@/features/maintenance/calendar/CalendarMonthView';
import { CalendarToolbar, type CalendarView } from '@/features/maintenance/calendar/CalendarToolbar';
import { CalendarWeekView } from '@/features/maintenance/calendar/CalendarWeekView';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { getErrorMessage } from '@/lib/api';
import { dateFnsLocale } from '@/lib/dateLocale';
import type { WorkOrderStatus } from '@/types/meta';

export function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [status, setStatus] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [technicianId, setTechnicianId] = useState('ALL');

  const isTechnician = user?.role === 'TECHNICIAN';
  const canFilterTechnicians =
    user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';

  const locale = dateFnsLocale();
  const rangeFrom =
    view === 'month'
      ? startOfWeek(startOfMonth(anchor), { weekStartsOn: 6, locale })
      : startOfWeek(anchor, { weekStartsOn: 6, locale });
  const rangeTo =
    view === 'month'
      ? endOfWeek(endOfMonth(anchor), { weekStartsOn: 6, locale })
      : endOfWeek(anchor, { weekStartsOn: 6, locale });

  const calendarQuery = useQuery({
    queryKey: [
      'calendar',
      {
        view,
        from: rangeFrom.toISOString(),
        to: rangeTo.toISOString(),
        technicianId,
        status,
      },
    ],
    queryFn: () =>
      calendarApi.list({
        from: rangeFrom.toISOString(),
        to: endOfDay(rangeTo).toISOString(),
        technicianId: technicianId === 'ALL' ? undefined : technicianId,
        status: status === 'ALL' ? undefined : status,
      }),
  });

  const techniciansQuery = useQuery({
    queryKey: ['technicians', { calendarFilter: true }],
    queryFn: () => techniciansApi.list({ limit: 100 }),
    enabled: canFilterTechnicians,
  });

  const workOrders = calendarQuery.data?.data ?? [];
  const errorMessage = calendarQuery.error ? getErrorMessage(calendarQuery.error, t('errors.network')) : null;

  const move = (direction: 'previous' | 'next') => {
    setAnchor((current) => {
      if (view === 'month') {
        return direction === 'next' ? addMonths(current, 1) : subMonths(current, 1);
      }
      return direction === 'next' ? addWeeks(current, 1) : subWeeks(current, 1);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.maintenance')}
        title={isTechnician ? t('nav.mySchedule') : t('calendar.title')}
        description={
          isTechnician
            ? t('technicians.monitorStaff')
            : t('calendar.subtitle')
        }
      />

      <CalendarToolbar
        view={view}
        anchor={anchor}
        status={status}
        technicianId={technicianId}
        technicians={techniciansQuery.data?.data ?? []}
        canFilterTechnicians={canFilterTechnicians}
        onViewChange={setView}
        onPrevious={() => move('previous')}
        onNext={() => move('next')}
        onToday={() => setAnchor(new Date())}
        onStatusChange={setStatus}
        onTechnicianChange={setTechnicianId}
      />

      {calendarQuery.isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : errorMessage ? (
        <ErrorState
          title={t('errors.network')}
          message={errorMessage}
          onRetry={() => void calendarQuery.refetch()}
        />
      ) : workOrders.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t('calendar.noWorkOrdersInRange')}
          description={t('calendar.noWorkOrdersInRangeDesc')}
        />
      ) : view === 'month' ? (
        <CalendarMonthView anchor={anchor} workOrders={workOrders} />
      ) : (
        <CalendarWeekView
          anchor={anchor}
          workOrders={workOrders}
          showTechnician={canFilterTechnicians && technicianId === 'ALL'}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-card" aria-hidden="true" />
          {t('calendar.scheduledWork')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-destructive/40 bg-destructive/10" aria-hidden="true" />
          {t('calendar.overdue')}
        </span>
      </div>
    </div>
  );
}
