import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { InsightContent } from '@/types/insights';

const SECTIONS: Array<{ key: keyof InsightContent; title: string }> = [
  { key: 'observations', title: 'Observations' },
  { key: 'repeatedPatterns', title: 'Repeated patterns' },
  { key: 'operationalRisks', title: 'Operational risks' },
  { key: 'preventiveRecommendations', title: 'Preventive recommendations' },
];

interface InsightSectionsProps {
  insights: InsightContent;
  compact?: boolean;
}

export function InsightSections({ insights, compact = false }: InsightSectionsProps) {
  return (
    <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
      {SECTIONS.map((section) => {
        const items = insights[section.key];

        return (
          <div key={section.key} className="rounded-md border border-border/70 bg-muted/20 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {section.title}
            </h4>
            <ul className="mt-2 space-y-1.5">
              {items.map((item, index) => (
                <li
                  key={`${section.key}-${index}`}
                  className="flex gap-2 text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
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
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              AI-generated insight
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {period} · {rangeLabel} · generated {generatedAt}
            </p>
          </div>
          {actions}
        </div>
        <InsightSections insights={insights} />
      </CardContent>
    </Card>
  );
}
