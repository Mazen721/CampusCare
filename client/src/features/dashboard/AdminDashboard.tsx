import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { AdminCharts } from '@/features/dashboard/AdminCharts';
import { AdminGovernanceLedgers } from '@/features/dashboard/AdminGovernanceLedgers';
import { AdminSummaryGrid } from '@/features/dashboard/AdminSummaryGrid';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

/**
 * Institutional governance command board for Super Admins pairing four clickable
 * KPI pillars, live audit and directory ledgers, MNU-calibrated analytics, and
 * full-width platform AI operational intelligence.
 */
export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { totals, analytics } = data;

  return (
    <div className="space-y-6">
      <AdminSummaryGrid totals={totals} />
      <AdminGovernanceLedgers totals={totals} />
      {analytics ? <AdminCharts analytics={analytics} /> : null}
      <InsightsPanel scope="admin" />
    </div>
  );
}
