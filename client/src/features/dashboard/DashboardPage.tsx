import {
  CalendarDays,
  ClipboardCheck,
  GitCompareArrows,
  Inbox,
  Plus,
  ScrollText,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/features/dashboard/ManagerDashboard';
import { OfficerDashboard } from '@/features/dashboard/OfficerDashboard';
import { TechnicianDashboard } from '@/features/dashboard/TechnicianDashboard';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { DashboardPeriodSelect } from '@/features/dashboard/DashboardPeriodSelect';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import { useAuth } from '@/features/auth/AuthContext';
import { getErrorMessage } from '@/lib/api';
import type { Role } from '@/types/auth';
import type { DashboardPeriod, DashboardResponse } from '@/types/dashboard';

interface PortalHeaderSpec {
  subtitleKey: string;
  primaryTo: string;
  primaryLabelKey: string;
  PrimaryIcon: LucideIcon;
  secondaryTo: string;
  secondaryLabelKey: string;
  SecondaryIcon: LucideIcon;
}

const PORTAL_HEADERS: Record<Role, PortalHeaderSpec> = {
  SUPER_ADMIN: {
    subtitleKey: 'dashboard.adminSubtitle',
    primaryTo: '/users',
    primaryLabelKey: 'dashboard.manageUsers',
    PrimaryIcon: Users,
    secondaryTo: '/activity-logs',
    secondaryLabelKey: 'dashboard.activityLogsCta',
    SecondaryIcon: ScrollText,
  },
  MAINTENANCE_MANAGER: {
    subtitleKey: 'dashboard.managerSubtitle',
    primaryTo: '/maintenance/request-queue',
    primaryLabelKey: 'dashboard.reviewRequests',
    PrimaryIcon: Inbox,
    secondaryTo: '/work-orders',
    secondaryLabelKey: 'nav.workOrders',
    SecondaryIcon: ClipboardCheck,
  },
  LOST_FOUND_OFFICER: {
    subtitleKey: 'dashboard.officerSubtitle',
    primaryTo: '/lost-found/claims',
    primaryLabelKey: 'dashboard.reviewClaims',
    PrimaryIcon: ShieldCheck,
    secondaryTo: '/lost-found/matches',
    secondaryLabelKey: 'dashboard.reviewMatches',
    SecondaryIcon: GitCompareArrows,
  },
  TECHNICIAN: {
    subtitleKey: 'dashboard.technicianSubtitle',
    primaryTo: '/work-orders',
    primaryLabelKey: 'nav.myWorkOrders',
    PrimaryIcon: Wrench,
    secondaryTo: '/maintenance/calendar',
    secondaryLabelKey: 'nav.mySchedule',
    SecondaryIcon: CalendarDays,
  },
  STUDENT_EMPLOYEE: {
    subtitleKey: 'dashboard.studentSubtitle',
    primaryTo: '/maintenance/requests/new',
    primaryLabelKey: 'dashboard.newMaintenanceRequest',
    PrimaryIcon: Plus,
    secondaryTo: '/lost-found/report',
    secondaryLabelKey: 'dashboard.reportLostFoundItem',
    SecondaryIcon: Plus,
  },
};

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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('7d');

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.id, user?.role, period],
    queryFn: () => dashboardApi.get(period),
    enabled: Boolean(user),
  });

  if (!user) return null;

  const portalHeader = PORTAL_HEADERS[user.role];
  const PrimaryIcon = portalHeader.PrimaryIcon;
  const SecondaryIcon = portalHeader.SecondaryIcon;
  const isRoleMatched = Boolean(dashboardQuery.data && dashboardQuery.data.role === user.role);
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const greetingSeparator = i18n.language === 'ar' ? '، ' : ', ';
  const errorMessage = dashboardQuery.error ? getErrorMessage(dashboardQuery.error) : null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greetingMorning')
      : hour < 18
        ? t('dashboard.greetingAfternoon')
        : t('dashboard.greetingEvening');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
            {greeting}
            {greetingSeparator}
            <bdi>{firstName}</bdi>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t(portalHeader.subtitleKey)}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <DashboardPeriodSelect
            value={period}
            onChange={setPeriod}
            className="w-full justify-between sm:w-auto sm:justify-start"
            selectClassName="h-10 flex-1 sm:h-9 sm:flex-initial"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
            <Button
              asChild
              size="sm"
              className="h-10 gap-1.5 bg-[hsl(var(--mnu-navy))] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))] sm:h-9"
            >
              <Link to={portalHeader.primaryTo}>
                <PrimaryIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t(portalHeader.primaryLabelKey)}</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 border-border bg-card px-3.5 text-xs font-semibold text-foreground shadow-sm hover:border-[hsl(var(--mnu-gold))] hover:bg-[hsl(var(--mnu-gold-tint))] hover:text-[hsl(var(--mnu-navy))] sm:h-9"
            >
              <Link to={portalHeader.secondaryTo}>
                <SecondaryIcon className="h-4 w-4 shrink-0 text-[hsl(var(--mnu-gold-ink))]" aria-hidden="true" />
                <span className="truncate">{t(portalHeader.secondaryLabelKey)}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {dashboardQuery.isLoading || (dashboardQuery.data && !isRoleMatched) ? (
        <LoadingState label={t('common.loading')} />
      ) : errorMessage ? (
        <ErrorState
          title={t('errors.generic')}
          message={errorMessage}
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : dashboardQuery.data && isRoleMatched ? (
        <RoleDashboard data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}
