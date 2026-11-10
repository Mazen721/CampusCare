import {
  BadgeCheck,
  GitCompareArrows,
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

/**
 * Four-column clickable KPI summary row for the Lost & Found Officer dashboard.
 */
export function OfficerSummaryGrid({ counts }: OfficerSummaryGridProps) {
  const { t } = useTranslation();
  const claimsInReview = counts.pendingClaims + counts.underVerificationClaims;

  const items: PortalSummaryMetric[] = [
    {
      key: 'open-lost',
      label: t('dashboard.openLostItems'),
      value: counts.openLostItems,
      hint: t('dashboard.openLostHint', { total: formatNumber(counts.totalLostItems) }),
      to: '/lost-found/items?type=LOST',
      icon: PackageSearch,
      accent: 'navy',
    },
    {
      key: 'open-found',
      label: t('dashboard.openFoundItems'),
      value: counts.openFoundItems,
      hint: t('dashboard.openFoundHint', { total: formatNumber(counts.totalFoundItems) }),
      to: '/lost-found/items?type=FOUND',
      icon: BadgeCheck,
      accent: 'navy',
    },
    {
      key: 'pending-matches',
      label: t('dashboard.activeMatches'),
      value: counts.pendingMatches,
      hint:
        counts.pendingMatches > 0
          ? t('dashboard.pendingReview')
          : t('dashboard.noPendingMatchesHint'),
      to: '/lost-found/matches',
      icon: GitCompareArrows,
      accent: counts.pendingMatches > 0 ? 'gold' : 'navy',
    },
    {
      key: 'claims-in-review',
      label: t('dashboard.claimsInReview'),
      value: claimsInReview,
      hint: t('dashboard.claimsTriageSummary', {
        pending: formatNumber(counts.pendingClaims),
        verifying: formatNumber(counts.underVerificationClaims),
      }),
      to: '/lost-found/claims',
      icon: ShieldCheck,
      accent: claimsInReview > 0 || counts.claimsAwaitingHandover > 0 ? 'gold' : 'navy',
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
