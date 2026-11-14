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
}

export function DashboardPeriodSelect({
  value,
  onChange,
  className,
}: DashboardPeriodSelectProps) {
  const { t } = useTranslation();

  const labels: Record<DashboardPeriod, { short: string; full: string }> = {
    '7d': { short: t('dashboard.periodShort7d'), full: t('dashboard.period7d') },
    '30d': { short: t('dashboard.periodShort30d'), full: t('dashboard.period30d') },
    '90d': { short: t('dashboard.periodShort90d'), full: t('dashboard.period90d') },
    all: { short: t('common.all'), full: t('common.all') },
  };

  return (
    <div
      role="group"
      aria-label={t('dashboard.period')}
      className={cn(
        'inline-flex h-9 items-center rounded-lg border border-border/80 bg-card p-1 text-xs shadow-xs',
        className,
      )}
    >
      {DASHBOARD_PERIODS.map((period) => {
        const active = value === period;
        return (
          <button
            key={period}
            type="button"
            aria-pressed={active}
            aria-label={labels[period].full}
            onClick={() => onChange(period)}
            className={cn(
              'rounded-md px-2.5 py-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {labels[period].short}
          </button>
        );
      })}
    </div>
  );
}
