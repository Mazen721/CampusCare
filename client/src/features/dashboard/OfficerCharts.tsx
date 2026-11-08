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
import { humanizeEnum } from '@/lib/labels';
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
  const categoryData = analytics.itemsByCategory.map((item) => ({
    category: item.category,
    lost: item.lost,
    found: item.found,
  }));

  const statusData = analytics.itemsByStatus.map((item) => ({
    status: humanizeEnum(item.status),
    count: item.count,
  }));

  const claimData = analytics.claimsByStatus.map((item) => ({
    status: humanizeEnum(item.status),
    count: item.count,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title="Reports by category (Lost vs. Found)"
        description="Comparison of lost and found volume across top categories."
      >
        {categoryData.length === 0 ? (
          <p className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
            No reports in this period.
          </p>
        ) : (
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
              <Bar dataKey="lost" name="Lost" fill={ACCENT} radius={[4, 4, 0, 0]} />
              <Bar dataKey="found" name="Found" fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Item lifecycle distribution"
        description="All items reported in this period, grouped by status."
      >
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={statusData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="status" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Items" fill={PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Claims verification status"
        description="Claims submitted by students in this period by review state."
      >
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            layout="vertical"
            data={claimData}
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="status"
              width={110}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ borderRadius: 8, borderColor: 'hsl(var(--border))', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Claims" fill={EMERALD} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
