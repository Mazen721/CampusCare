import {
  CheckCircle2,
  Clock3,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PortalSummaryGrid,
  type PortalSummaryMetric,
} from '@/features/dashboard/PortalSummaryGrid';
import { enumLabel } from '@/lib/labels';
import type { TechnicianDashboard as TechnicianDashboardData } from '@/types/dashboard';

interface TechnicianSummaryGridProps {
  counts: TechnicianDashboardData['counts'];
}

/**
 * Four-column clickable KPI summary row for the Technician dispatch dashboard.
 */
export function TechnicianSummaryGrid({ counts }: TechnicianSummaryGridProps) {
  const { t } = useTranslation();

  const items: PortalSummaryMetric[] = [
    {
      key: 'assigned',
      label: enumLabel('status', 'ASSIGNED'),
      value: counts.assigned,
      hint: t('dashboard.technicianAssignedHint'),
      to: '/work-orders?status=ASSIGNED',
      icon: Wrench,
      accent: counts.assigned > 0 ? 'gold' : 'navy',
    },
    {
      key: 'in-progress',
      label: enumLabel('status', 'IN_PROGRESS'),
      value: counts.inProgress,
      hint: t('dashboard.technicianInProgressHint'),
      to: '/work-orders?status=IN_PROGRESS',
      icon: Clock3,
      accent: counts.inProgress > 0 ? 'gold' : 'navy',
    },
    {
      key: 'overdue',
      label: t('common.overdue'),
      value: counts.overdue,
      hint:
        counts.overdue > 0
          ? t('dashboard.technicianOverdueHint')
          : t('dashboard.technicianOnTrackHint'),
      to: '/work-orders',
      icon: TriangleAlert,
      accent: counts.overdue > 0 ? 'danger' : 'navy',
    },
    {
      key: 'completed',
      label: enumLabel('status', 'COMPLETED'),
      value: counts.completed,
      hint: t('dashboard.technicianCompletedHint'),
      to: '/work-orders?status=COMPLETED',
      icon: CheckCircle2,
      accent: 'navy',
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
