import { useTranslation } from 'react-i18next';
import { enumLabel } from '@/lib/labels';
import { formatNumber } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { AdminDashboard } from '@/types/dashboard';

const BUILDING_AR_FALLBACK: Record<string, string> = {
  'Administration & Central Library Building': 'مبنى إدارة الجامعة والمكتبة المركزية',
  'Medical Sector Complex A & B': 'مجمع الكليات الطبية',
  'Engineering & Technological Complex A & B': 'مجمع الكليات الهندسية والتكنولوجية',
  'Humanities & Business Building': 'مبنى العلوم الإنسانية والاقتصاد وإدارة الأعمال',
  'Central Workshops & Laboratories Building': 'مبنى الورش والمعامل المركزية',
  'Student Activities & Sports Complex': 'منطقة الأنشطة الطلابية والملاعب الرياضية',
  'Engineering & Technological Complex': 'مجمع الكليات الهندسية والتكنولوجية',
  'Medical Sector Complex': 'مجمع الكليات الطبية',
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

const ROLE_DOT_CLASSES: Record<Role, string> = {
  STUDENT_EMPLOYEE: 'bg-primary',
  TECHNICIAN: 'bg-emerald-600',
  MAINTENANCE_MANAGER: 'bg-[hsl(var(--mnu-gold))]',
  LOST_FOUND_OFFICER: 'bg-[hsl(var(--mnu-gold-ink))]',
  SUPER_ADMIN: 'bg-destructive',
};

interface NormalizedBuildingRow {
  building: string;
  maintenance: number;
  lostFound: number;
}

function normalizeBuildingData(
  items: AdminDashboard['analytics']['activityByBuilding'],
  isArabic: boolean,
): NormalizedBuildingRow[] {
  const merged = new Map<string, NormalizedBuildingRow>();

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

function BuildingLoadMatrixCard({
  buildings,
}: {
  buildings: NormalizedBuildingRow[];
}) {
  const { t } = useTranslation();
  const maxCombinedLoad = Math.max(
    ...buildings.map((item) => item.maintenance + item.lostFound),
    1,
  );

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border/80 bg-card shadow-xs lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/75 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            {t('dashboard.adminBuildingMatrixTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('dashboard.adminBuildingMatrixDesc')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-primary" aria-hidden="true" />
            <span>{t('dashboard.maintenance')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-xs bg-[hsl(var(--mnu-gold))]"
              aria-hidden="true"
            />
            <span>{t('dashboard.lostFound')}</span>
          </span>
        </div>
      </div>

      {buildings.length === 0 ? (
        <div className="p-6">
          <p className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
            {t('dashboard.noRequestsInPeriod')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto px-6 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/75 text-muted-foreground">
                <th className="pb-2.5 text-start font-semibold">
                  {t('dashboard.adminCampusBuildingCol')}
                </th>
                <th className="px-3 pb-2.5 text-center font-semibold">
                  {t('dashboard.maintenance')}
                </th>
                <th className="px-3 pb-2.5 text-center font-semibold">
                  {t('dashboard.lostFound')}
                </th>
                <th className="w-44 pb-2.5 text-start font-semibold">
                  {t('dashboard.adminCombinedLoadCol')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {buildings.map((building, index) => {
                const total = building.maintenance + building.lostFound;
                const maintPct = (building.maintenance / maxCombinedLoad) * 100;
                const lfPct = (building.lostFound / maxCombinedLoad) * 100;
                const isTopLoad = index === 0 && total > 0;

                return (
                  <tr key={building.building}>
                    <td className="py-3 pe-3 font-medium text-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <span dir="auto" className="font-semibold">
                          {building.building}
                        </span>
                        {isTopLoad ? (
                          <span className="rounded-full border border-amber-500/35 bg-amber-500/[0.12] px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {t('dashboard.adminTopLoadBadge')}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold tabular-nums text-foreground">
                      {formatNumber(building.maintenance)}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold tabular-nums text-[hsl(var(--mnu-gold-ink))]">
                      {formatNumber(building.lostFound)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          {maintPct > 0 ? (
                            <div
                              className="h-full bg-primary transition-[width] duration-200"
                              style={{ width: `${maintPct}%` }}
                            />
                          ) : null}
                          {lfPct > 0 ? (
                            <div
                              className="h-full bg-[hsl(var(--mnu-gold))] transition-[width] duration-200"
                              style={{ width: `${lfPct}%` }}
                            />
                          ) : null}
                        </div>
                        <span className="w-8 text-end font-bold tabular-nums text-foreground">
                          {formatNumber(total)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleGovernanceAndVolumeCard({
  usersByRole,
  moduleVolume,
}: {
  usersByRole: AdminDashboard['analytics']['usersByRole'];
  moduleVolume: AdminDashboard['analytics']['moduleVolume'];
}) {
  const { t } = useTranslation();

  const totalAccounts = usersByRole.reduce((sum, entry) => sum + entry.count, 0);
  const localizedModules = moduleVolume.map((item) => {
    const key = MODULE_LABEL_KEYS[item.module];
    return {
      key: item.module,
      label: key ? t(key) : item.module,
      count: item.count,
    };
  });
  const hasModuleActivity = localizedModules.some((item) => item.count > 0);
  const maxVolume = Math.max(...localizedModules.map((item) => item.count), 1);

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-5">
      <div className="space-y-4">
        <div className="border-b border-border/75 pb-3.5">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            {t('dashboard.adminRoleGovernanceTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('dashboard.adminRoleGovernanceDesc', {
              count: formatNumber(totalAccounts),
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
          {usersByRole.map((entry) => (
            <div
              key={entry.role}
              className="flex items-center justify-between rounded-lg bg-secondary/45 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${ROLE_DOT_CLASSES[entry.role] ?? 'bg-primary'}`}
                  aria-hidden="true"
                />
                <span className="truncate">{enumLabel('role', entry.role)}</span>
              </span>
              <span className="ms-2 shrink-0 font-bold tabular-nums text-foreground">
                {formatNumber(entry.count)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <p className="font-semibold text-foreground">
            {t('dashboard.adminCrossModuleVolumeHeading')}
          </p>

          {!hasModuleActivity ? (
            <p className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-xs text-muted-foreground">
              {t('dashboard.noActivityInPeriod')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {localizedModules.map((item) => {
                const widthPct = Math.round((item.count / maxVolume) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 font-medium">
                      <span className="truncate text-muted-foreground">{item.label}</span>
                      <span className="shrink-0 font-bold tabular-nums text-foreground">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-200"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 12-column cross-system analytics row pairing a 7-col Campus Building Load Matrix
 * with a 5-col Role Governance & Cross-Module Volume card.
 */
export function AdminCharts({
  analytics,
}: {
  analytics: AdminDashboard['analytics'];
}) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const buildingData = normalizeBuildingData(analytics.activityByBuilding, isArabic);

  return (
    <section aria-label={t('dashboard.activityByBuilding')} className="grid gap-6 lg:grid-cols-12">
      <BuildingLoadMatrixCard buildings={buildingData} />
      <RoleGovernanceAndVolumeCard
        usersByRole={analytics.usersByRole}
        moduleVolume={analytics.moduleVolume}
      />
    </section>
  );
}
