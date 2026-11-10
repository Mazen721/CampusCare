import { OfficerCharts } from '@/features/dashboard/OfficerCharts';
import { OfficerSummaryGrid } from '@/features/dashboard/OfficerSummaryGrid';
import { OfficerTriageLedgers } from '@/features/dashboard/OfficerTriageLedgers';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';

/**
 * Lost & Found Officer operational command board pairing KPI summary counters,
 * live claims/matches triage ledgers, and MNU-calibrated analytics charts.
 */
export function OfficerDashboard({ data }: { data: OfficerDashboardData }) {
  return (
    <div className="space-y-6">
      <OfficerSummaryGrid counts={data.counts} />
      <OfficerTriageLedgers counts={data.counts} />
      {data.analytics ? <OfficerCharts analytics={data.analytics} /> : null}
    </div>
  );
}
