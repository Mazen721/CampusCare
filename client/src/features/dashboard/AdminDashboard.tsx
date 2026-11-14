import { AdminCharts } from '@/features/dashboard/AdminCharts';
import { AdminGovernanceLedgers } from '@/features/dashboard/AdminGovernanceLedgers';
import { AdminSummaryGrid } from '@/features/dashboard/AdminSummaryGrid';
import type { AdminDashboard as AdminDashboardData } from '@/types/dashboard';

/**
 * Dedicated whole-system tracking command board for Super Admins pairing:
 * - Row 1: 3 executive subsystem domain monitors
 * - Row 2: 7/5 Campus Building Cross-System Load Matrix & Role Governance
 * - Row 3: 8/4 filterable Cross-System Audit Trail & Account Directory Rail
 */
export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { totals, analytics } = data;

  return (
    <div className="space-y-7">
      <AdminSummaryGrid totals={totals} />
      {analytics ? <AdminCharts analytics={analytics} /> : null}
      <AdminGovernanceLedgers totals={totals} />
    </div>
  );
}
