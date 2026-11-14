import {
  Inbox,
  Plus,
  ShieldCheck,
  Sparkles,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/features/dashboard/ManagerDashboard';
import { OfficerDashboard } from '@/features/dashboard/OfficerDashboard';
import { TechnicianDashboard } from '@/features/dashboard/TechnicianDashboard';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { DashboardPeriodSelect } from '@/features/dashboard/DashboardPeriodSelect';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import { useAuth } from '@/features/auth/AuthContext';
import { tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { DashboardPeriod, DashboardResponse } from '@/types/dashboard';

interface PortalHeaderSpec {
  subtitleKey: string;
  primaryTo: string;
  primaryLabelKey: string;
  PrimaryIcon: LucideIcon;
}

const PORTAL_HEADERS: Record<Role, PortalHeaderSpec> = {
  SUPER_ADMIN: {
    subtitleKey: 'dashboard.adminSubtitle',
    primaryTo: '/users',
    primaryLabelKey: 'dashboard.manageUsers',
    PrimaryIcon: Users,
  },
  MAINTENANCE_MANAGER: {
    subtitleKey: 'dashboard.managerSubtitle',
    primaryTo: '/maintenance/request-queue',
    primaryLabelKey: 'dashboard.reviewRequests',
    PrimaryIcon: Inbox,
  },
  LOST_FOUND_OFFICER: {
    subtitleKey: 'dashboard.officerSubtitle',
    primaryTo: '/lost-found/claims',
    primaryLabelKey: 'dashboard.reviewClaims',
    PrimaryIcon: ShieldCheck,
  },
  TECHNICIAN: {
    subtitleKey: 'dashboard.technicianSubtitle',
    primaryTo: '/work-orders',
    primaryLabelKey: 'nav.myWorkOrders',
    PrimaryIcon: Wrench,
  },
  STUDENT_EMPLOYEE: {
    subtitleKey: 'dashboard.studentSubtitle',
    primaryTo: '/maintenance/requests/new',
    primaryLabelKey: 'dashboard.newMaintenanceRequest',
    PrimaryIcon: Plus,
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
  const [aiOpen, setAiOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.id, user?.role, period],
    queryFn: () => dashboardApi.get(period),
    enabled: Boolean(user),
  });

  if (!user) return null;

  const portalHeader = PORTAL_HEADERS[user.role];
  const PrimaryIcon = portalHeader.PrimaryIcon;
  const showHeaderAiDrawer =
    user.role === 'MAINTENANCE_MANAGER' || user.role === 'SUPER_ADMIN';
  const showPeriodFilter =
    user.role !== 'TECHNICIAN' && user.role !== 'STUDENT_EMPLOYEE';
  const isRoleMatched = Boolean(dashboardQuery.data && dashboardQuery.data.role === user.role);
  const displayName = tr(user, 'name') || user.name;
  const firstName =
    displayName
      .replace(/^(?:م\.|د\.|أ\.|Eng\.|Dr\.)\s+/i, '')
      .trim()
      .split(/\s+/)[0] ?? displayName;
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
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
              {greeting}
              {greetingSeparator}
              <bdi>{firstName}</bdi>
            </h1>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/[0.08] font-semibold text-primary"
            >
              {enumLabel('role', user.role)}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t(portalHeader.subtitleKey)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {showHeaderAiDrawer ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={aiOpen}
              onClick={() => setAiOpen((prev) => !prev)}
              className={cn(
                'h-9 gap-1.5 rounded-lg border px-3.5 text-xs font-semibold shadow-xs transition-colors',
                aiOpen
                  ? 'border-amber-500/40 bg-amber-500/[0.12] text-amber-900'
                  : 'border-border/80 bg-card text-foreground hover:border-amber-500/40 hover:bg-amber-500/[0.08]',
              )}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
              <span>{t('ai.toggleInsights')}</span>
            </Button>
          ) : null}

          {showPeriodFilter ? (
            <DashboardPeriodSelect value={period} onChange={setPeriod} />
          ) : null}

          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))]"
          >
            <Link to={portalHeader.primaryTo}>
              <PrimaryIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(portalHeader.primaryLabelKey)}</span>
            </Link>
          </Button>
        </div>
      </header>

      {showHeaderAiDrawer && aiOpen ? (
        <section aria-label={t('ai.toggleInsights')}>
          <InsightsPanel
            scope={user.role === 'SUPER_ADMIN' ? 'admin' : 'maintenance'}
            defaultPeriod={period === '7d' || period === '30d' ? period : '7d'}
            onClose={() => setAiOpen(false)}
          />
        </section>
      ) : null}

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
