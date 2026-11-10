import { InsightsPanel } from '@/features/ai/InsightsPanel';
import { ManagerCharts } from '@/features/dashboard/ManagerCharts';
import { ManagerSummaryGrid } from '@/features/dashboard/ManagerSummaryGrid';
import { ManagerTriageLedgers } from '@/features/dashboard/ManagerTriageLedgers';
import type { ManagerDashboard as ManagerDashboardData } from '@/types/dashboard';

/**
 * Action-first Maintenance Manager command board pairing four clickable KPIs,
 * live request-review and work-order dispatch queues, MNU-calibrated analytics,
 * and AI operational insights.
 */
export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  return (
    <div className="space-y-6">
      <ManagerSummaryGrid metrics={data.metrics} />
      <ManagerTriageLedgers metrics={data.metrics} />
      <ManagerCharts metrics={data.metrics} />
      <InsightsPanel />
    </div>
  );
}
