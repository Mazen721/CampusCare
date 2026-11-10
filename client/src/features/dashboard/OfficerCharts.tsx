import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { enumLabel } from '@/lib/labels';
import type { OfficerDashboard } from '@/types/dashboard';

const MNU_NAVY = 'hsl(var(--primary))';
const MNU_GOLD_INK = 'hsl(var(--mnu-gold-ink))';
const MNU_SLATE = 'hsl(var(--muted-foreground))';

const TICK_STYLE = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const CHART_MARGIN = { top: 8, right: 8, left: -10, bottom: 16 };
const TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 10,
  borderColor: 'hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};

function ChartCard({
  title,
  description,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  description: string;
  isEmpty: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col rounded-xl border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="mt-auto pt-2">
        {isEmpty ? (
          <p className="flex h-[250px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <div dir="ltr">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Three-column MNU-calibrated analytics row for lost & found category,
 * report status, and claim pipeline volume.
 */
export function OfficerCharts({
  analytics,
}: {
  analytics: OfficerDashboard['analytics'];
}) {
  const { t } = useTranslation();

  const categoryData = analytics.itemsByCategory.map((item) => ({
    category: enumLabel('lostFoundCategory', item.category),
    lost: item.lost,
    found: item.found,
  }));

  const statusData = analytics.itemsByStatus.map((item) => ({
    status: enumLabel('status', item.status),
    count: item.count,
  }));

  const claimData = analytics.claimsByStatus.map((item) => ({
    status: enumLabel('status', item.status),
    count: item.count,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title={t('dashboard.itemsByCategory')}
        description={t('dashboard.itemsByCategoryDesc')}
        isEmpty={categoryData.length === 0}
        emptyLabel={t('lostFound.noItemsFound')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="category"
              tick={TICK_STYLE}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={76}
            />
            <YAxis allowDecimals={false} tick={TICK_STYLE} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="lost" name={t('dashboard.lost')} fill={MNU_GOLD_INK} radius={[4, 4, 0, 0]} />
            <Bar dataKey="found" name={t('dashboard.found')} fill={MNU_NAVY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('lostFound.title')}
        description={t('dashboard.itemsByStatusDesc')}
        isEmpty={statusData.length === 0}
        emptyLabel={t('lostFound.noItemsFound')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={statusData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="status"
              tick={TICK_STYLE}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={76}
            />
            <YAxis allowDecimals={false} tick={TICK_STYLE} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name={t('dashboard.items')} fill={MNU_NAVY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('claims.title')}
        description={t('dashboard.claimsByStatusDesc')}
        isEmpty={claimData.length === 0}
        emptyLabel={t('claims.noClaimsFound')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={claimData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="status"
              tick={TICK_STYLE}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={76}
            />
            <YAxis allowDecimals={false} tick={TICK_STYLE} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name={t('dashboard.claims')} fill={MNU_SLATE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
