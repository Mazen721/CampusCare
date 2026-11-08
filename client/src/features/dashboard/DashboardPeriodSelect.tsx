import {
  DASHBOARD_PERIOD_LABELS,
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from '@/types/dashboard';

interface DashboardPeriodSelectProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

export function DashboardPeriodSelect({ value, onChange }: DashboardPeriodSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="dashboard-period" className="text-xs font-medium text-muted-foreground">
        Period
      </label>
      <select
        id="dashboard-period"
        value={value}
        onChange={(event) => onChange(event.target.value as DashboardPeriod)}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {DASHBOARD_PERIODS.map((period) => (
          <option key={period} value={period}>
            {DASHBOARD_PERIOD_LABELS[period]}
          </option>
        ))}
      </select>
    </div>
  );
}
