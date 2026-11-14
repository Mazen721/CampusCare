import {
  GitCompareArrows,
  Handshake,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PortalSummaryGrid,
  type PortalSummaryMetric,
} from '@/features/dashboard/PortalSummaryGrid';
import { formatNumber } from '@/lib/utils';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';

interface OfficerSummaryGridProps {
  counts: OfficerDashboardData['counts'];
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.round((value / total) * 100));
}

/**
 * Four-column clickable KPI summary row for the Lost & Found Officer dashboard.
 */
export function OfficerSummaryGrid({ counts }: OfficerSummaryGridProps) {
  const { t } = useTranslation();

  const claimsInReview = counts.pendingClaims + counts.underVerificationClaims;
  const totalClaims = claimsInReview + counts.claimsAwaitingHandover + counts.completedHandovers;
  const openReports = counts.openLostItems + counts.openFoundItems;
  const totalReports = counts.totalLostItems + counts.totalFoundItems;

  const items: PortalSummaryMetric[] = [
    {
      key: 'pending-claims',
      label: t('dashboard.pendingClaims'),
      value: claimsInReview,
      hint: t('dashboard.claimsTriageSummary', {
        pending: formatNumber(counts.pendingClaims),
        verifying: formatNumber(counts.underVerificationClaims),
      }),
      to: '/lost-found/claims',
      icon: ShieldCheck,
      accent: 'gold',
      progress: toPercent(claimsInReview, totalClaims),
    },
    {
      key: 'suggested-matches',
      label: t('dashboard.officerSuggestedMatchesLabel'),
      value: counts.pendingMatches,
      hint:
        counts.pendingMatches > 0
          ? t('dashboard.pendingReview')
          : t('dashboard.noPendingMatchesHint'),
      to: '/lost-found/matches',
      icon: GitCompareArrows,
      accent: 'emerald',
      progress:
        counts.pendingMatches > 0
          ? toPercent(counts.pendingMatches, Math.max(openReports, counts.pendingMatches))
          : 0,
    },
    {
      key: 'open-reports',
      label: t('dashboard.officerOpenReportsLabel'),
      value: openReports,
      hint: t('dashboard.officerOpenReportsHint', {
        lost: formatNumber(counts.openLostItems),
        found: formatNumber(counts.openFoundItems),
      }),
      to: '/lost-found/items',
      icon: PackageSearch,
      accent: 'navy',
      progress: toPercent(openReports, totalReports),
    },
    {
      key: 'returned-items',
      label: t('dashboard.officerReturnedItemsLabel'),
      value: counts.completedHandovers,
      hint: t('dashboard.officerReturnedItemsHint', {
        awaiting: formatNumber(counts.claimsAwaitingHandover),
      }),
      to: '/lost-found/handovers',
      icon: Handshake,
      accent: 'emerald',
      progress: toPercent(counts.completedHandovers, totalClaims),
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
