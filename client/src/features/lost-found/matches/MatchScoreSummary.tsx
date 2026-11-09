import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ItemMatch } from '@/types/matches';

interface MatchScoreSummaryProps {
  match: ItemMatch;
  className?: string;
}

export function MatchScoreSummary({ match, className }: MatchScoreSummaryProps) {
  const { t } = useTranslation();
  const strong = match.level === 'STRONG';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'font-display text-2xl leading-none',
            strong ? 'text-emerald-700' : 'text-amber-700',
          )}
        >
          {Math.round(match.score)}%
        </span>
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.12em]',
            strong ? 'text-emerald-700' : 'text-amber-700',
          )}
        >
          {strong ? t('matches.strong') : t('matches.possible')}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t('matches.criteriaBreakdown', {
          cat: Math.round(match.breakdown.category * 100),
          loc: Math.round(match.breakdown.location * 100),
          date: Math.round(match.breakdown.date * 100),
        })}
      </p>
    </div>
  );
}
