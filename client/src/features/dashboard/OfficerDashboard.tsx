import { OfficerCharts } from '@/features/dashboard/OfficerCharts';
import { OfficerSummaryGrid } from '@/features/dashboard/OfficerSummaryGrid';
import { OfficerTriageLedgers } from '@/features/dashboard/OfficerTriageLedgers';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';

/**
 * Lost & Found Officer operational command board pairing four KPI cards,
 * a 12-column claims/matches triage & recovery pipeline bento row, and
 * a 2-column analytics row.
 */
export function OfficerDashboard({ data }: { data: OfficerDashboardData }) {
  return (
    <div className="space-y-7">
      <OfficerSummaryGrid counts={data.counts} />
      <OfficerTriageLedgers counts={data.counts} />
      {data.analytics ? <OfficerCharts analytics={data.analytics} /> : null}
    </div>
  );
}
