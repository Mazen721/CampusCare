import { ManagerCharts } from '@/features/dashboard/ManagerCharts';
import { ManagerSummaryGrid } from '@/features/dashboard/ManagerSummaryGrid';
import { ManagerTriageLedgers } from '@/features/dashboard/ManagerTriageLedgers';
import type { ManagerDashboard as ManagerDashboardData } from '@/types/dashboard';

/**
 * Action-first Maintenance Manager command board pairing four KPI cards,
 * a 12-column triage & SLA bento row, and a 2-column analytics row.
 */
export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  return (
    <div className="space-y-7">
      <ManagerSummaryGrid metrics={data.metrics} />
      <ManagerTriageLedgers metrics={data.metrics} />
      <ManagerCharts metrics={data.metrics} />
    </div>
  );
}
