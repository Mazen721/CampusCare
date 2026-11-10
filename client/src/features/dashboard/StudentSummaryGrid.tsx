import { ClipboardList, PackageSearch, ShieldCheck, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PortalSummaryGrid,
  type PortalSummaryMetric,
} from '@/features/dashboard/PortalSummaryGrid';
import { formatNumber } from '@/lib/utils';
import type { RequestStatus } from '@/types/meta';
import type { StudentDashboard as StudentDashboardData } from '@/types/dashboard';

const ACTIVE_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'REOPENED',
];

interface StudentSummaryGridProps {
  data: StudentDashboardData;
}

/**
 * Four-column KPI summary row for the student and employee portal dashboard.
 * Each card navigates to the corresponding personal list view.
 */
export function StudentSummaryGrid({ data }: StudentSummaryGridProps) {
  const { t } = useTranslation();

  const activeRequests = ACTIVE_STATUSES.reduce(
    (sum, status) => sum + data.requests.byStatus[status],
    0,
  );
  const completedRequests = data.requests.byStatus.COMPLETED + data.requests.byStatus.CLOSED;
  const inProgressCount = data.requests.byStatus.IN_PROGRESS;

  const items: PortalSummaryMetric[] = [
    {
      key: 'requests',
      label: t('dashboard.myRequests'),
      value: data.requests.total,
      hint:
        data.requests.total > 0
          ? `${formatNumber(completedRequests)} ${t('dashboard.completed')}`
          : t('dashboard.totalSubmitted'),
      to: '/maintenance/requests',
      icon: ClipboardList,
      accent: 'navy',
    },
    {
      key: 'active',
      label: t('dashboard.activeRequests'),
      value: activeRequests,
      hint:
        inProgressCount > 0
          ? `${formatNumber(inProgressCount)} ${t('enums.status.IN_PROGRESS')}`
          : t('dashboard.active'),
      to: '/maintenance/requests',
      icon: Wrench,
      accent: activeRequests > 0 ? 'gold' : 'navy',
    },
    {
      key: 'claims',
      label: t('dashboard.myClaims'),
      value: data.claims.total,
      hint: t('claims.title'),
      to: '/lost-found/claims',
      icon: ShieldCheck,
      accent: data.claims.total > 0 ? 'gold' : 'navy',
    },
    {
      key: 'reports',
      label: t('dashboard.myReports'),
      value: data.reports.total,
      hint: `${formatNumber(data.reports.lost)} ${t('dashboard.lost')} · ${formatNumber(data.reports.found)} ${t('dashboard.found')}`,
      to: '/lost-found/my-reports',
      icon: PackageSearch,
      accent: 'navy',
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
