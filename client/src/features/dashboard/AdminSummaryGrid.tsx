import {
  ClipboardList,
  MapPin,
  PackageSearch,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PortalSummaryGrid,
  type PortalSummaryMetric,
} from '@/features/dashboard/PortalSummaryGrid';
import { formatNumber } from '@/lib/utils';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

interface AdminSummaryGridProps {
  totals: AdminDashboardData['totals'];
}

/**
 * Four-column clickable KPI summary row for the Super Admin governance board.
 */
export function AdminSummaryGrid({ totals }: AdminSummaryGridProps) {
  const { t } = useTranslation();
  const pendingTriage = totals.pendingMatches + totals.pendingClaims;

  const items: PortalSummaryMetric[] = [
    {
      key: 'users',
      label: t('users.title'),
      value: totals.users,
      hint: t('dashboard.adminUsersHint', {
        active: formatNumber(totals.activeUsers),
        technicians: formatNumber(totals.technicians),
      }),
      to: '/users',
      icon: Users,
      accent: 'navy',
    },
    {
      key: 'locations',
      label: t('locations.title'),
      value: totals.locations,
      hint: t('dashboard.adminLocationsHint', {
        buildings: formatNumber(totals.buildings),
      }),
      to: '/locations',
      icon: MapPin,
      accent: 'navy',
    },
    {
      key: 'maintenance',
      label: t('dashboard.maintenance'),
      value: totals.maintenanceRequests,
      hint: t('dashboard.adminMaintenanceHint', {
        workOrders: formatNumber(totals.workOrders),
      }),
      to: '/maintenance/requests',
      icon: ClipboardList,
      accent: 'navy',
    },
    {
      key: 'lost-found',
      label: t('dashboard.lostFound'),
      value: totals.lostItems + totals.foundItems,
      hint:
        pendingTriage > 0
          ? t('dashboard.adminLostFoundPendingHint', {
              open: formatNumber(totals.openLostFoundItems),
              matches: formatNumber(totals.pendingMatches),
              claims: formatNumber(totals.pendingClaims),
            })
          : t('dashboard.adminLostFoundHint', {
              open: formatNumber(totals.openLostFoundItems),
              lost: formatNumber(totals.lostItems),
              found: formatNumber(totals.foundItems),
            }),
      to: '/lost-found/items',
      icon: PackageSearch,
      accent: pendingTriage > 0 ? 'gold' : 'navy',
    },
  ];

  return <PortalSummaryGrid items={items} ariaLabel={t('nav.groupOverview')} />;
}
