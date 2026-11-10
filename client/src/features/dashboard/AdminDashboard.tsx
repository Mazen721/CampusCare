import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  GitCompareArrows,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { AdminCharts } from '@/features/dashboard/AdminCharts';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { totals, analytics } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label={t('users.title')}
          value={totals.users}
          icon={Users}
          hint={`${formatNumber(totals.activeUsers)} ${t('common.active')} · ${formatNumber(totals.technicians)} ${t('technicians.title')}`}
        />
        <DashboardStatCard
          label={t('locations.title')}
          value={totals.locations}
          icon={MapPin}
          hint={`${formatNumber(totals.buildings)} ${t('locations.building')}`}
        />
        <DashboardStatCard
          label={t('dashboard.maintenance')}
          value={totals.maintenanceRequests}
          icon={ClipboardList}
          hint={`${formatNumber(totals.workOrders)} ${t('workOrders.title')}`}
        />
        <DashboardStatCard
          label={t('dashboard.lostFound')}
          value={totals.lostItems + totals.foundItems}
          icon={PackageSearch}
          hint={`${formatNumber(totals.lostItems)} ${t('dashboard.lost')} · ${formatNumber(totals.foundItems)} ${t('dashboard.found')}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label={t('dashboard.openLostItems')}
          value={totals.openLostFoundItems}
          icon={PackageSearch}
          hint={t('dashboard.openFoundItems')}
        />
        <DashboardStatCard
          label={t('dashboard.activeMatches')}
          value={totals.pendingMatches}
          icon={GitCompareArrows}
          tone={totals.pendingMatches > 0 ? 'warning' : 'default'}
          hint={t('matches.title')}
        />
        <DashboardStatCard
          label={t('dashboard.pendingClaims')}
          value={totals.pendingClaims}
          icon={ShieldCheck}
          tone={totals.pendingClaims > 0 ? 'warning' : 'default'}
          hint={t('claims.title')}
        />
      </div>

      {analytics ? <AdminCharts analytics={analytics} /> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <InsightsPanel scope="admin" />

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.adminOverview')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.adminOverviewDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/users">
                {t('dashboard.manageUsers')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/locations">
                {t('dashboard.manageLocations')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/activity-logs">
                {t('dashboard.openActivityLogs')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/maintenance/requests">
                {t('nav.maintenanceView')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/lost-found/items">
                {t('nav.lostFoundView')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              {t('dashboard.adminReadOnlyNotice')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
