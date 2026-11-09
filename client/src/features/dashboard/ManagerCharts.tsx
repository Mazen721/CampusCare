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
import { REQUEST_STATUSES } from '@/types/meta';
import type { ManagerMetrics } from '@/types/dashboard';

const PRIMARY = 'hsl(var(--primary))';
const ACCENT = 'hsl(38 92% 50%)';

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

export function ManagerCharts({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();

  const statusData = REQUEST_STATUSES.map((status) => ({
    status: enumLabel('status', status),
    count: metrics.requestsByStatus[status],
  }));

  const categoryData = metrics.requestsByCategory.slice(0, 6).map((entry) => ({
    category: enumLabel('maintenanceCategory', entry.category),
    count: entry.count,
  }));

  const workloadData = [...metrics.technicianWorkload]
    .sort(
      (a, b) =>
        b.activeWorkOrders + b.completedWorkOrders -
        (a.activeWorkOrders + a.completedWorkOrders),
    )
    .slice(0, 5)
    .map((technician) => ({
      name: technician.name.split(' ')[0] ?? technician.name,
      active: technician.activeWorkOrders,
      completed: technician.completedWorkOrders,
    }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title={t('dashboard.statusDistribution')}
        description={t('requests.subtitle')}
      >
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={statusData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
              />
              <Bar dataKey="count" name={t('dashboard.requests')} fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title={t('dashboard.requestsByCategory')}
        description={t('requests.filterByCategory')}
      >
        {categoryData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('requests.noRequestsFound')}
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
                <Bar dataKey="count" name={t('dashboard.requests')} fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title={t('dashboard.technicianWorkload')}
        description={t('technicians.subtitle')}
      >
        {workloadData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            {t('technicians.noTechniciansFound')}
          </p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={workloadData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="active" name={t('dashboard.active')} stackId="work" fill={PRIMARY} radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" name={t('dashboard.completed')} stackId="work" fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
