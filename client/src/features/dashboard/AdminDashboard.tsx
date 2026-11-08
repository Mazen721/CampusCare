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
import { Link } from 'react-router-dom';
import { InsightSections } from '@/features/ai/InsightSections';
import { DashboardStatCard } from '@/features/dashboard/DashboardStatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { totals, latestInsights } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Users"
          value={totals.users}
          icon={Users}
          hint={`${totals.activeUsers} active · ${totals.technicians} technicians`}
        />
        <DashboardStatCard
          label="Locations"
          value={totals.locations}
          icon={MapPin}
          hint={`${totals.buildings} buildings`}
        />
        <DashboardStatCard
          label="Maintenance"
          value={totals.maintenanceRequests}
          icon={ClipboardList}
          hint={`${totals.workOrders} work orders`}
        />
        <DashboardStatCard
          label="Lost & found"
          value={totals.lostItems + totals.foundItems}
          icon={PackageSearch}
          hint={`${totals.lostItems} lost · ${totals.foundItems} found`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Open lost & found items"
          value={totals.openLostFoundItems}
          icon={PackageSearch}
          hint="Open or awaiting claim"
        />
        <DashboardStatCard
          label="Pending matches"
          value={totals.pendingMatches}
          icon={GitCompareArrows}
          tone={totals.pendingMatches > 0 ? 'warning' : 'default'}
          hint="Awaiting officer review"
        />
        <DashboardStatCard
          label="Pending claims"
          value={totals.pendingClaims}
          icon={ShieldCheck}
          tone={totals.pendingClaims > 0 ? 'warning' : 'default'}
          hint="Review or verification"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-sm">Latest AI maintenance insight</CardTitle>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Read-only. Only maintenance managers can generate a fresh insight.
              </p>
            </div>
            {latestInsights ? (
              <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {latestInsights.period}
              </span>
            ) : null}
          </CardHeader>
          <CardContent className="pt-1">
            {latestInsights ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Generated {formatDate(latestInsights.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })}{' '}
                  · {formatDate(latestInsights.rangeStart)} – {formatDate(latestInsights.rangeEnd)}
                </p>
                <InsightSections insights={latestInsights.insights} compact />
              </div>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">
                No AI insight has been cached yet. A maintenance manager can generate one from
                their dashboard.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Administration
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Read-only cross-module totals and audit access.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/users">
                Manage users
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/locations">
                Manage locations
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/activity-logs">
                Open activity logs
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/maintenance/requests">
                Maintenance view
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to="/lost-found/items">
                Lost & Found view
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              Admin accounts cannot change maintenance workflow state.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
