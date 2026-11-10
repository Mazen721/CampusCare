import { TechnicianDispatchLedgers } from '@/features/dashboard/TechnicianDispatchLedgers';
import { TechnicianSummaryGrid } from '@/features/dashboard/TechnicianSummaryGrid';
import type { TechnicianDashboard as TechnicianDashboardData } from '@/types/dashboard';

/**
 * Pure dispatch workbench for maintenance technicians pairing four clickable
 * status KPIs with live active/overdue and upcoming work-order queues.
 */
export function TechnicianDashboard({ data }: { data: TechnicianDashboardData }) {
  return (
    <div className="space-y-6">
      <TechnicianSummaryGrid counts={data.counts} />
      <TechnicianDispatchLedgers data={data} />
    </div>
  );
}
