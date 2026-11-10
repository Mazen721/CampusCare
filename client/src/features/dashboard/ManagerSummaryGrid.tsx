import {
  Inbox,
  Timer,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PortalSummaryGrid,
  type PortalSummaryMetric,
} from '@/features/dashboard/PortalSummaryGrid';
import { formatNumber } from '@/lib/utils';
import type { ManagerMetrics } from '@/types/dashboard';

interface ManagerSummaryGridProps {
  metrics: ManagerMetrics;
}

/**
 * Four-column clickable KPI summary row for the Maintenance Manager dashboard.
 */
export function ManagerSummaryGrid({ metrics }: ManagerSummaryGridProps) {
  const { t } = useTranslation();

  const pendingReviewCount =
    metrics.requestsByStatus.SUBMITTED +
    metrics.requestsByStatus.UNDER_REVIEW +
    metrics.requestsByStatus.REOPENED;

  const avgHours = metrics.averageResolutionHours;
  const resolutionValue =
    avgHours === null || (avgHours === 0 && metrics.completedWorkOrders === 0)
      ? '—'
      : avgHours < 0.1
        ? t('dashboard.underTenthHour')
        : t('dashboard.hoursShort', {
            hours: formatNumber(avgHours, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          });

  const qualityHint =
    metrics.feedback.averageRating !== null
      ? t('dashboard.managerQualityHint', {
          rating: formatNumber(metrics.feedback.averageRating, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }),
          count: formatNumber(metrics.feedback.total),
        })
      : t('dashboard.noRatingYet');

  const items: PortalSummaryMetric[] = [
    {
      key: 'pending-review',
      label: t('dashboard.managerPendingReview'),
      value: pendingReviewCount,
      hint: t('dashboard.managerTotalRequestsHint', {
        total: formatNumber(metrics.totalRequests),
      }),
      to: '/maintenance/request-queue',
      icon: Inbox,
      accent: pendingReviewCount > 0 ? 'gold' : 'navy',
    },
    {
      key: 'active-work-orders',
      label: t('dashboard.activeWorkOrders'),
      value: metrics.activeWorkOrders,
      hint: t('dashboard.managerCompletedOrdersHint', {
        count: formatNumber(metrics.completedWorkOrders),
      }),
      to: '/work-orders',
      icon: Wrench,
      accent: 'navy',
    },
    {
      key: 'overdue-work-orders',
      label: t('dashboard.overdue'),
      value: metrics.overdueWorkOrders,
      hint:
        metrics.overdueWorkOrders > 0
          ? t('dashboard.managerOverdueHint')
          : t('dashboard.technicianOnTrackHint'),
      to: '/work-orders',
      icon: TriangleAlert,
      accent: metrics.overdueWorkOrders > 0 ? 'danger' : 'navy',
    },
    {
      key: 'avg-resolution',
      label: t('dashboard.avgResolution'),
      value: resolutionValue,
      hint: qualityHint,
      to: '/maintenance/feedback',
      icon: Timer,
      accent: 'navy',
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
