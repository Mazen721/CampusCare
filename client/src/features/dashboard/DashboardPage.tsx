import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/features/dashboard/ManagerDashboard';
import { OfficerDashboard } from '@/features/dashboard/OfficerDashboard';
import { TechnicianDashboard } from '@/features/dashboard/TechnicianDashboard';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { DashboardPeriodSelect } from '@/features/dashboard/DashboardPeriodSelect';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/types/auth';
import type { DashboardPeriod, DashboardResponse } from '@/types/dashboard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function RoleDashboard({ data }: { data: DashboardResponse }) {
  switch (data.role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard data={data} />;
    case 'MAINTENANCE_MANAGER':
      return <ManagerDashboard data={data} />;
    case 'TECHNICIAN':
      return <TechnicianDashboard data={data} />;
    case 'LOST_FOUND_OFFICER':
      return <OfficerDashboard data={data} />;
    case 'STUDENT_EMPLOYEE':
      return <StudentDashboard data={data} />;
    default:
      return null;
  }
}

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('7d');

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.id, user?.role, period],
    queryFn: () => dashboardApi.get(period),
    enabled: Boolean(user),
  });

  if (!user) return null;

  const isRoleMatched = Boolean(dashboardQuery.data && dashboardQuery.data.role === user.role);
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const today = formatDate(new Date(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const errorMessage =
    dashboardQuery.error instanceof ApiError
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? 'Unable to load your dashboard right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your workspace"
        title={`${getGreeting()}, ${firstName}.`}
        description={`Signed in as ${ROLE_LABELS[user.role]}. Here is what is happening across your areas.`}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {today}
            </span>
            <DashboardPeriodSelect value={period} onChange={setPeriod} />
          </>
        }
      />

      {dashboardQuery.isLoading || (dashboardQuery.data && !isRoleMatched) ? (
        <LoadingState label="Loading your dashboard…" />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load your dashboard"
          message={errorMessage}
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : dashboardQuery.data && isRoleMatched ? (
        <RoleDashboard data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}
