import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatTone = 'default' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<StatTone, { icon: string; value: string }> = {
  default: { icon: 'bg-primary/10 text-primary', value: 'text-foreground' },
  success: { icon: 'bg-emerald-100 text-emerald-800', value: 'text-emerald-900' },
  warning: { icon: 'bg-amber-100 text-amber-800', value: 'text-amber-900' },
  danger: { icon: 'bg-red-100 text-red-800', value: 'text-red-900' },
};

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: DashboardStatCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <Card className={cn('shadow-none', className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className={cn('mt-2 font-display text-3xl leading-none', styles.value)}>
            {value}
          </p>
          {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
              styles.icon,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
