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
  accent?: 'gold' | 'navy' | 'danger';
}

interface PortalSummaryGridProps {
  items: PortalSummaryMetric[];
  ariaLabel: string;
}

/**
 * Four-column clickable KPI summary row following the MNU portal card language.
 */
export function PortalSummaryGrid({ items, ariaLabel }: PortalSummaryGridProps) {
  return (
    <section aria-label={ariaLabel} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isDanger = item.accent === 'danger';
        return (
          <Link
            key={item.key}
            to={item.to}
            className={cn(
              'group flex items-start justify-between gap-3 rounded-xl border bg-card p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isDanger
                ? 'border-destructive/35 hover:border-destructive'
                : 'border-border hover:border-[hsl(var(--mnu-navy)/0.38)]',
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  'text-xs',
                  isDanger ? 'font-semibold text-destructive' : 'font-medium text-muted-foreground',
                )}
              >
                {item.label}
              </p>
              <p
                className={cn(
                  'mt-2.5 text-[1.75rem] font-bold leading-none tracking-[-0.02em] tabular-nums',
                  isDanger ? 'text-destructive' : 'text-foreground',
                )}
              >
                {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
              </p>
              <p
                className={cn(
                  'mt-2 truncate text-xs',
                  isDanger ? 'text-destructive/90' : 'text-muted-foreground',
                )}
              >
                {item.hint}
              </p>
            </div>
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                item.accent === 'gold'
                  ? 'bg-[hsl(var(--mnu-gold-tint))] text-[hsl(var(--mnu-gold-ink))]'
                  : isDanger
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/[0.08] text-primary',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}
