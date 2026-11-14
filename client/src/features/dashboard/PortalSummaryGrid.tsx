import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatNumber } from '@/lib/utils';

export interface PortalSummaryMetric {
  key: string;
  label: string;
  value: number | string;
  hint: string;
  to: string;
  icon: LucideIcon;
  accent?: 'gold' | 'navy' | 'emerald' | 'danger';
  progress?: number;
}

type AccentTone = NonNullable<PortalSummaryMetric['accent']>;

const ACCENT_STYLES: Record<
  AccentTone,
  {
    topBar: string;
    iconChip: string;
    progressFill: string;
    labelClass: string;
    valueClass: string;
    hintClass: string;
  }
> = {
  navy: {
    topBar: 'bg-primary',
    iconChip: 'bg-primary/[0.08] text-primary',
    progressFill: 'bg-primary',
    labelClass: 'font-medium text-muted-foreground',
    valueClass: 'text-foreground',
    hintClass: 'text-muted-foreground',
  },
  gold: {
    topBar: 'bg-[hsl(var(--mnu-gold))]',
    iconChip: 'bg-amber-500/[0.12] text-amber-800',
    progressFill: 'bg-amber-600',
    labelClass: 'font-medium text-muted-foreground',
    valueClass: 'text-foreground',
    hintClass: 'text-muted-foreground',
  },
  emerald: {
    topBar: 'bg-emerald-600',
    iconChip: 'bg-emerald-500/10 text-emerald-700',
    progressFill: 'bg-emerald-600',
    labelClass: 'font-medium text-muted-foreground',
    valueClass: 'text-foreground',
    hintClass: 'text-muted-foreground',
  },
  danger: {
    topBar: 'bg-destructive',
    iconChip: 'bg-destructive/10 text-destructive',
    progressFill: 'bg-destructive',
    labelClass: 'font-semibold text-destructive',
    valueClass: 'text-destructive',
    hintClass: 'text-destructive/90',
  },
};

interface PortalSummaryGridProps {
  items: PortalSummaryMetric[];
  ariaLabel: string;
}

/**
 * Four-column clickable KPI summary row following the restrained MNU portal card language.
 */
export function PortalSummaryGrid({ items, ariaLabel }: PortalSummaryGridProps) {
  return (
    <section aria-label={ariaLabel} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const accent = item.accent ?? 'navy';
        const style = ACCENT_STYLES[accent];
        const fallbackProgress =
          typeof item.value === 'number'
            ? item.value > 0
              ? 100
              : 0
            : item.value === '—'
              ? 0
              : 100;
        const clampedProgress = Math.max(0, Math.min(100, item.progress ?? fallbackProgress));

        return (
          <Link
            key={item.key}
            to={item.to}
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              accent === 'danger'
                ? 'hover:border-destructive/60'
                : 'hover:border-primary/40',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('absolute inset-x-0 top-0 h-[3px]', style.topBar)}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn('text-xs', style.labelClass)}>{item.label}</p>
                <p
                  className={cn(
                    'mt-2.5 text-[1.75rem] font-bold leading-none tracking-[-0.02em] tabular-nums',
                    style.valueClass,
                  )}
                >
                  {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                </p>
              </div>
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  style.iconChip,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <p className={cn('truncate text-xs', style.hintClass)}>{item.hint}</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-200', style.progressFill)}
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
