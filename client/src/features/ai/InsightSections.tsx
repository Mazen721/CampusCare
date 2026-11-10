import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import type { InsightContent } from '@/types/insights';

interface InsightSectionsProps {
  insights: InsightContent;
  compact?: boolean;
}

export function InsightSections({ insights, compact = false }: InsightSectionsProps) {
  const { t } = useTranslation();

  const sections: Array<{ key: keyof InsightContent; title: string }> = [
    { key: 'observations', title: t('ai.observations') },
    { key: 'repeatedPatterns', title: t('ai.repeatedPatterns') },
    { key: 'operationalRisks', title: t('ai.operationalRisks') },
    { key: 'preventiveRecommendations', title: t('ai.preventiveRecommendations') },
  ];

  return (
    <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
      {sections.map((section) => {
        const items = insights[section.key];

        return (
          <div key={section.key} className="rounded-lg border border-border/75 bg-secondary/35 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground ltr:uppercase ltr:tracking-[0.12em]">
              {section.title}
            </h4>
            <ul className="mt-2.5 space-y-1.5">
              {items.map((item, index) => (
                <li
                  key={`${section.key}-${index}`}
                  dir="auto"
                  className="flex gap-2 text-start text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
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
    <Card className="rounded-xl border-border bg-card shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary ltr:uppercase ltr:tracking-[0.12em]">
              {t('ai.insights')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
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
