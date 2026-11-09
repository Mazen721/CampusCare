import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { enumLabel } from '@/lib/labels';
import type { TechnicianDashboard } from '@/types/dashboard';

const PRIMARY = 'hsl(var(--primary))';
const ACCENT = 'hsl(38 92% 50%)';
const DANGER = 'hsl(0 84% 60%)';

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

export function TechnicianCharts({
  analytics,
}: {
  analytics: TechnicianDashboard['analytics'];
}) {
  const { t } = useTranslation();

  const priorityData = analytics.byPriority.map((item) => ({
    priority: enumLabel('priority', item.priority),
    count: item.count,
  }));

  const categoryData = analytics.byCategory.slice(0, 6).map((item) => ({
    category: enumLabel('maintenanceCategory', item.category),
    count: item.count,
  }));

  const statusData = analytics.statusDistribution.map((item) => ({
    status: enumLabel('status', item.status),
    count: item.count,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title={t('common.priority')}
        description={t('requests.filterByPriority')}
      >
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={priorityData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
              />
              <Bar dataKey="count" name={t('dashboard.jobs')} fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title={t('dashboard.requestsByCategory')}
        description={t('technicians.specializations')}
      >
        {categoryData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('workOrders.noWorkOrdersFound')}
          </p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={105}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
                />
                <Bar dataKey="count" name={t('dashboard.jobs')} fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title={t('dashboard.statusDistribution')}
        description={t('workOrders.subtitle')}
      >
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
              <Bar dataKey="count" name={t('dashboard.jobs')} fill={DANGER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
