import {
  ArrowUpRight,
  BadgeCheck,
  GitCompareArrows,
  Handshake,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { OfficerCharts } from '@/features/dashboard/OfficerCharts';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';

export function OfficerDashboard({ data }: { data: OfficerDashboardData }) {
  const { t } = useTranslation();
  const { counts, analytics } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label={t('dashboard.openLostItems')}
          value={counts.openLostItems}
          icon={PackageSearch}
          hint={`${counts.totalLostItems} ${t('dashboard.lost')}`}
        />
        <DashboardStatCard
          label={t('dashboard.openFoundItems')}
          value={counts.openFoundItems}
          icon={BadgeCheck}
          hint={`${counts.totalFoundItems} ${t('dashboard.found')}`}
        />
        <DashboardStatCard
          label={t('dashboard.activeMatches')}
          value={counts.pendingMatches}
          icon={GitCompareArrows}
          tone={counts.pendingMatches > 0 ? 'warning' : 'default'}
          hint={t('matches.subtitle')}
        />
        <DashboardStatCard
          label={t('dashboard.claimsInReview')}
          value={counts.pendingClaims + counts.underVerificationClaims}
          icon={ShieldCheck}
          tone={counts.pendingClaims + counts.underVerificationClaims > 0 ? 'warning' : 'default'}
          hint={`${counts.pendingClaims} · ${counts.underVerificationClaims}`}
        />
      </div>

      {analytics ? <OfficerCharts analytics={analytics} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.handovers')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.handoversDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-center justify-between rounded-md border border-amber-300/60 bg-amber-50 px-4 py-3">
              <div>
                <p className="text-2xl font-semibold text-amber-950">{counts.claimsAwaitingHandover}</p>
                <p className="text-xs text-amber-900/80">{t('dashboard.awaitingHandover')}</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/lost-found/handovers">
                  {t('dashboard.openQueue')}
                  <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-90" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border border-emerald-300/60 bg-emerald-50 px-4 py-3">
              <div>
                <p className="text-2xl font-semibold text-emerald-950">{counts.completedHandovers}</p>
                <p className="text-xs text-emerald-900/80">{t('dashboard.completedHandovers')}</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/lost-found/claims">
                  {t('dashboard.viewClaims')}
                  <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-90" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('dashboard.quickActions')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.quickActionsDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/lost-found/matches">
                {t('matches.title')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/lost-found/claims">
                {t('claims.title')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/lost-found/items">
                {t('lostFound.allReports')}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-90" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
