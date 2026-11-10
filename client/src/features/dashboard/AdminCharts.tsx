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
import type { AdminDashboard } from '@/types/dashboard';

const MNU_NAVY = 'hsl(var(--primary))';
const MNU_GOLD_INK = 'hsl(var(--mnu-gold-ink))';
const MNU_SLATE = 'hsl(var(--muted-foreground))';

const TICK_STYLE = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const HORIZONTAL_MARGIN = { top: 4, right: 16, left: 4, bottom: 4 };
const TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 10,
  borderColor: 'hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};

const BUILDING_AR_FALLBACK: Record<string, string> = {
  'Administration & Central Library Building': 'مبنى الإدارة والمكتبة المركزية',
  'Engineering & Technological Complex': 'مجمع الهندسة والتكنولوجيا',
  'Medical Sector Complex': 'مجمع القطاع الطبي',
  'Humanities & Business Building': 'مبنى العلوم الإنسانية وإدارة الأعمال',
};

const MODULE_LABEL_KEYS: Record<string, string> = {
  Requests: 'dashboard.requests',
  'Work Orders': 'nav.workOrders',
  'Lost Items': 'dashboard.lostItemsLabel',
  'Found Items': 'dashboard.foundItemsLabel',
  Claims: 'dashboard.claims',
  Maintenance: 'dashboard.maintenance',
  'Lost & Found': 'dashboard.lostFound',
};

function normalizeBuildingData(
  items: AdminDashboard['analytics']['activityByBuilding'],
  isArabic: boolean,
) {
  const merged = new Map<
    string,
    { building: string; maintenance: number; lostFound: number }
  >();

  for (const item of items) {
    const enName = (item.name || item.building || '').trim();
    const arName =
      (item.nameAr || item.buildingAr || '').trim() ||
      BUILDING_AR_FALLBACK[enName] ||
      '';
    const label = isArabic && arName ? arName : enName;
    const key = enName || label;
    if (!key) continue;

    const current = merged.get(key) ?? {
      building: label,
      maintenance: 0,
      lostFound: 0,
    };
    current.maintenance += item.maintenance;
    current.lostFound += item.lostFound;
    merged.set(key, current);
  }

  return Array.from(merged.values())
    .sort((a, b) => b.maintenance + b.lostFound - (a.maintenance + a.lostFound))
    .slice(0, 6);
}

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
    <Card className="flex h-full min-w-0 flex-col rounded-xl border-border bg-card shadow-none">
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
 * Three-column MNU-calibrated analytics row covering campus building demand,
 * user accounts by role, and cross-module activity volume.
 */
export function AdminCharts({
  analytics,
}: {
  analytics: AdminDashboard['analytics'];
}) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const buildingData = normalizeBuildingData(analytics.activityByBuilding, isArabic);

  const roleData = analytics.usersByRole.map((item) => ({
    role: enumLabel('role', item.role),
    count: item.count,
  }));

  const moduleData = analytics.moduleVolume.map((item) => {
    const key = MODULE_LABEL_KEYS[item.module];
    return {
      module: key ? t(key) : item.module,
      count: item.count,
    };
  });

  const hasModuleActivity = moduleData.some((item) => item.count > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        title={t('dashboard.activityByBuilding')}
        description={t('dashboard.activityByBuildingDesc')}
        isEmpty={buildingData.length === 0}
        emptyLabel={t('dashboard.noRequestsInPeriod')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart layout="vertical" data={buildingData} margin={HORIZONTAL_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
            <YAxis
              type="category"
              dataKey="building"
              width={142}
              tickMargin={6}
              tick={TICK_STYLE}
            />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="maintenance"
              name={t('dashboard.maintenance')}
              fill={MNU_NAVY}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="lostFound"
              name={t('dashboard.lostFound')}
              fill={MNU_GOLD_INK}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('dashboard.usersByRole')}
        description={t('dashboard.usersByRoleDesc')}
        isEmpty={roleData.length === 0}
        emptyLabel={t('users.noUsersFound')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart layout="vertical" data={roleData} margin={HORIZONTAL_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
            <YAxis
              type="category"
              dataKey="role"
              width={126}
              tickMargin={6}
              tick={TICK_STYLE}
            />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="count"
              name={t('dashboard.accounts')}
              fill={MNU_SLATE}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('dashboard.crossModuleActivity')}
        description={t('dashboard.crossModuleActivityDesc')}
        isEmpty={!hasModuleActivity}
        emptyLabel={t('dashboard.noActivityInPeriod')}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart layout="vertical" data={moduleData} margin={HORIZONTAL_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
            <YAxis
              type="category"
              dataKey="module"
              width={118}
              tickMargin={6}
              tick={TICK_STYLE}
            />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="count"
              name={t('dashboard.totalRecords')}
              fill={MNU_NAVY}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
