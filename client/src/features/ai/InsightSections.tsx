import { CheckCircle2, Eye, Repeat2, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatNumber } from '@/lib/utils';
import type { InsightContent } from '@/types/insights';

interface InsightSectionsProps {
  insights: InsightContent;
  compact?: boolean;
}

interface SectionConfig {
  key: keyof InsightContent;
  titleKey: string;
  icon: LucideIcon;
  cardClass: string;
  iconChipClass: string;
  dotClass: string;
  numbered?: boolean;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    key: 'observations',
    titleKey: 'ai.observations',
    icon: Eye,
    cardClass: 'border-border/80 bg-card',
    iconChipClass: 'bg-primary/[0.08] text-primary',
    dotClass: 'bg-primary',
  },
  {
    key: 'repeatedPatterns',
    titleKey: 'ai.repeatedPatterns',
    icon: Repeat2,
    cardClass: 'border-border/80 bg-card',
    iconChipClass: 'bg-secondary text-foreground',
    dotClass: 'bg-muted-foreground',
  },
  {
    key: 'operationalRisks',
    titleKey: 'ai.operationalRisks',
    icon: TriangleAlert,
    cardClass: 'border-amber-500/25 bg-amber-500/[0.03]',
    iconChipClass: 'bg-amber-500/[0.12] text-amber-800',
    dotClass: 'bg-amber-600',
  },
  {
    key: 'preventiveRecommendations',
    titleKey: 'ai.preventiveRecommendations',
    icon: CheckCircle2,
    cardClass: 'border-emerald-500/25 bg-emerald-500/[0.03]',
    iconChipClass: 'bg-emerald-500/10 text-emerald-700',
    dotClass: 'bg-emerald-600',
    numbered: true,
  },
];

const CODE_TOKEN_RE = /\b((?:MR|WO|LF|CLM|REQ)-\d+)\b/g;

function renderFormattedLine(text: string): ReactNode {
  const parts = text.split(CODE_TOKEN_RE);
  if (parts.length === 1) return text;

  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <code
        key={`${part}-${idx}`}
        dir="ltr"
        className="mx-0.5 inline-block rounded bg-secondary px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground"
      >
        {part}
      </code>
    ) : (
      <Fragment key={`${idx}-${part.slice(0, 8)}`}>{part}</Fragment>
    ),
  );
}

export function InsightSections({ insights, compact = false }: InsightSectionsProps) {
  const { t } = useTranslation();

  return (
    <div className={compact ? 'space-y-4' : 'grid gap-4 md:grid-cols-2'}>
      {SECTION_CONFIGS.map((section) => {
        const items = insights[section.key];
        const Icon = section.icon;

        return (
          <section
            key={section.key}
            aria-label={t(section.titleKey)}
            className={cn(
              'flex flex-col rounded-xl border p-5 transition-colors',
              section.cardClass,
            )}
          >
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  section.iconChipClass,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h4 className="text-sm font-semibold text-foreground">{t(section.titleKey)}</h4>
            </div>

            <ul className="mt-3.5 space-y-3">
              {items.map((item, index) => (
                <li
                  key={`${section.key}-${index}`}
                  dir="auto"
                  className="flex items-start gap-2.5 text-start text-sm leading-[1.75] text-foreground/90"
                >
                  {section.numbered ? (
                    <span
                      aria-hidden="true"
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold tabular-nums text-emerald-800"
                    >
                      {formatNumber(index + 1)}
                    </span>
                  ) : (
                    <span
                      className={cn('mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full', section.dotClass)}
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 flex-1">{renderFormattedLine(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

interface InsightReadOnlyCardProps {
  period: string;
  generatedAt: string;
  rangeLabel: string;
  insights: InsightContent;
  actions?: ReactNode;
}

export function InsightReadOnlyCard({
  period,
  generatedAt,
  rangeLabel,
  insights,
  actions,
}: InsightReadOnlyCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-xl border-border/80 bg-card shadow-xs">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">{t('ai.insights')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {period} · {rangeLabel} · {generatedAt}
            </p>
          </div>
          {actions}
        </div>
        <InsightSections insights={insights} />
      </CardContent>
    </Card>
  );
}
