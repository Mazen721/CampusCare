import type { ReactNode } from 'react';
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

const PRIMARY = 'hsl(var(--primary))';
const ACCENT = 'hsl(38 92% 50%)';
const EMERALD = 'hsl(150 70% 38%)';

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

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
        description={t('lostFound.subtitle')}
      >
        {categoryData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('lostFound.noItemsFound')}
          </p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={categoryData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={44} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lost" name={t('dashboard.lost')} fill={ACCENT} radius={[4, 4, 0, 0]} />
                <Bar dataKey="found" name={t('dashboard.found')} fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title={t('lostFound.title')}
        description={t('dashboard.statusDistribution')}
      >
        {statusData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('lostFound.noItemsFound')}
          </p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={statusData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={44} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
                />
                <Bar dataKey="count" name={t('dashboard.items')} fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title={t('claims.title')}
        description={t('dashboard.statusDistribution')}
      >
        {claimData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('claims.noClaimsFound')}
          </p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={claimData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={44} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
                />
                <Bar dataKey="count" name={t('dashboard.claims')} fill={EMERALD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
