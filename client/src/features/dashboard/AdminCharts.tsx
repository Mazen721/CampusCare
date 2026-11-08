import type { ReactNode } from 'react';
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
import { ROLE_SHORT_LABELS } from '@/types/auth';
import type { AdminDashboard } from '@/types/dashboard';

const PRIMARY = 'hsl(var(--primary))';
const ACCENT = 'hsl(38 92% 50%)';
const SLATE = 'hsl(215 25% 40%)';

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

export function AdminCharts({
  analytics,
}: {
  analytics: AdminDashboard['analytics'];
}) {
  const buildingData = analytics.activityByBuilding.map((item) => ({
    building: item.building,
    maintenance: item.maintenance,
    lostFound: item.lostFound,
  }));

  const roleData = analytics.usersByRole.map((item) => ({
    role: ROLE_SHORT_LABELS[item.role] ?? item.role,
    count: item.count,
  }));

  const moduleData = analytics.moduleVolume.map((item) => ({
    module: item.module,
    count: item.count,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title="Activity by building"
        description="Maintenance and Lost & Found demand across campus facilities."
      >
        {buildingData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            No activity in this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={buildingData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="building" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={44} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="maintenance" name="Maintenance" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lostFound" name="Lost & Found" fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Users by role"
        description="Registered university accounts distributed across system roles."
      >
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            layout="vertical"
            data={roleData}
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="role"
              width={105}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Accounts" fill={SLATE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Cross-module activity"
        description="Activity created across modules in the selected timeframe."
      >
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={moduleData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="module" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Total records" fill={PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
