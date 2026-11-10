import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from '@/types/dashboard';

interface DashboardPeriodSelectProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
  className?: string;
  selectClassName?: string;
}

export function DashboardPeriodSelect({
  value,
  onChange,
  className,
  selectClassName,
}: DashboardPeriodSelectProps) {
  const { t } = useTranslation();

  const labels: Record<DashboardPeriod, string> = {
    '7d': t('dashboard.period7d'),
    '30d': t('dashboard.period30d'),
    '90d': t('dashboard.period90d'),
    all: t('common.all'),
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="dashboard-period" className="shrink-0 text-xs font-medium text-muted-foreground">
        {t('dashboard.period')}
      </label>
      <select
        id="dashboard-period"
        value={value}
        onChange={(event) => onChange(event.target.value as DashboardPeriod)}
        className={cn(
          'h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          selectClassName,
        )}
      >
        {DASHBOARD_PERIODS.map((period) => (
          <option key={period} value={period}>
            {labels[period]}
          </option>
        ))}
      </select>
    </div>
  );
}
