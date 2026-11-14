import { useTranslation } from 'react-i18next';
import { enumLabel } from '@/lib/labels';
import { formatNumber } from '@/lib/utils';
import type { OfficerDashboard } from '@/types/dashboard';
import { ITEM_STATUSES, type ItemStatus } from '@/types/lostFound';

const STATUS_DONUT_COLOR: Record<ItemStatus, { strokeClass: string; dotClass: string }> = {
  OPEN: { strokeClass: 'stroke-primary', dotClass: 'bg-primary' },
  MATCH_CONFIRMED: { strokeClass: 'stroke-emerald-500', dotClass: 'bg-emerald-500' },
  CLAIM_UNDER_REVIEW: { strokeClass: 'stroke-amber-500', dotClass: 'bg-amber-500' },
  APPROVED_FOR_HANDOVER: { strokeClass: 'stroke-amber-600', dotClass: 'bg-amber-600' },
  RETURNED: { strokeClass: 'stroke-emerald-600', dotClass: 'bg-emerald-600' },
  CLOSED: { strokeClass: 'stroke-muted-foreground/60', dotClass: 'bg-muted-foreground/60' },
};

const FALLBACK_STATUS_COLOR = {
  strokeClass: 'stroke-primary/70',
  dotClass: 'bg-primary/70',
};

const DONUT_RADIUS = 15.91549430918954;

interface ItemDonutSegment {
  status: string;
  label: string;
  count: number;
  pct: number;
  roundedPct: number;
  offset: number;
  strokeClass: string;
  dotClass: string;
}

function buildItemStatusSegments(
  itemsByStatus: OfficerDashboard['analytics']['itemsByStatus'],
): { totalItems: number; segments: ItemDonutSegment[] } {
  const countByStatus = new Map<string, number>();
  itemsByStatus.forEach((entry) => {
    countByStatus.set(entry.status, (countByStatus.get(entry.status) ?? 0) + entry.count);
  });

  const orderedStatuses = [
    ...ITEM_STATUSES,
    ...itemsByStatus
      .map((entry) => entry.status)
      .filter((status) => !ITEM_STATUSES.includes(status as ItemStatus)),
  ];

  const uniqueStatuses = Array.from(new Set(orderedStatuses));
  const activeEntries = uniqueStatuses
    .map((status) => {
      const style = STATUS_DONUT_COLOR[status as ItemStatus] ?? FALLBACK_STATUS_COLOR;
      return {
        status,
        label: enumLabel('status', status),
        count: countByStatus.get(status) ?? 0,
        ...style,
      };
    })
    .filter((entry) => entry.count > 0);

  const totalItems = activeEntries.reduce((sum, entry) => sum + entry.count, 0);
  let cumulativePct = 0;

  const segments = activeEntries.map((entry) => {
    const pct = totalItems > 0 ? (entry.count / totalItems) * 100 : 0;
    const offset = -cumulativePct;
    cumulativePct += pct;
    return {
      ...entry,
      pct,
      roundedPct: Math.round(pct),
      offset,
    };
  });

  return { totalItems, segments };
}

function ItemsByStatusDonutCard({
  itemsByStatus,
}: {
  itemsByStatus: OfficerDashboard['analytics']['itemsByStatus'];
}) {
  const { t } = useTranslation();
  const { totalItems, segments } = buildItemStatusSegments(itemsByStatus);
  const openCount =
    itemsByStatus.find((entry) => entry.status === 'OPEN')?.count ?? 0;
  const returnedCount =
    itemsByStatus.find((entry) => entry.status === 'RETURNED')?.count ?? 0;

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {t('dashboard.itemsByStatusTitle')}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('dashboard.itemsByStatusTotalDesc', {
            total: formatNumber(totalItems),
          })}
        </p>
      </div>

      {totalItems === 0 || segments.length === 0 ? (
        <p className="mt-5 flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
          {t('lostFound.noItemsFound')}
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
              <svg
                className="h-40 w-40 -rotate-90"
                viewBox="0 0 36 36"
                role="img"
                aria-label={t('dashboard.itemsByStatusTitle')}
              >
                <circle
                  cx="18"
                  cy="18"
                  r={DONUT_RADIUS}
                  fill="transparent"
                  className="stroke-secondary"
                  strokeWidth="3.8"
                />
                {segments.map((segment) => (
                  <circle
                    key={segment.status}
                    cx="18"
                    cy="18"
                    r={DONUT_RADIUS}
                    fill="transparent"
                    className={segment.strokeClass}
                    strokeWidth="3.8"
                    strokeDasharray={`${segment.pct} ${100 - segment.pct}`}
                    strokeDashoffset={segment.offset}
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute text-center">
                <span className="block text-2xl font-bold leading-none tabular-nums text-foreground">
                  {formatNumber(totalItems)}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                  {t('dashboard.items')}
                </span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-2 text-xs">
              {segments.map((segment) => (
                <div
                  key={segment.status}
                  className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.dotClass}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{segment.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">
                    {formatNumber(segment.count)}{' '}
                    <span className="font-normal text-muted-foreground">
                      ({formatNumber(segment.roundedPct)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-border/75 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span>
                {enumLabel('status', 'OPEN')}:{' '}
                <strong className="font-semibold tabular-nums text-foreground">
                  {formatNumber(openCount)}
                </strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              <span>
                {enumLabel('status', 'RETURNED')}:{' '}
                <strong className="font-semibold tabular-nums text-foreground">
                  {formatNumber(returnedCount)}
                </strong>
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function TopItemCategoriesCard({
  itemsByCategory,
}: {
  itemsByCategory: OfficerDashboard['analytics']['itemsByCategory'];
}) {
  const { t } = useTranslation();

  const topCategories = [...itemsByCategory]
    .filter((entry) => entry.lost + entry.found > 0)
    .sort((a, b) => b.lost + b.found - (a.lost + a.found))
    .slice(0, 5);

  const maxCategoryVolume = Math.max(
    ...topCategories.map((entry) => entry.lost + entry.found),
    1,
  );

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {t('dashboard.topItemCategoriesTitle')}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('dashboard.itemsByCategoryDesc')}
        </p>
      </div>

      {topCategories.length === 0 ? (
        <p className="mt-5 flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
          {t('lostFound.noItemsFound')}
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-3 text-xs">
            {topCategories.map((entry) => {
              const lostWidth = (entry.lost / maxCategoryVolume) * 100;
              const foundWidth = (entry.found / maxCategoryVolume) * 100;

              return (
                <div key={entry.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 font-medium">
                    <span className="truncate text-foreground">
                      {enumLabel('lostFoundCategory', entry.category)}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {t('dashboard.categoryLostFoundMeta', {
                        lost: formatNumber(entry.lost),
                        found: formatNumber(entry.found),
                      })}
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    {lostWidth > 0 ? (
                      <div
                        className="h-full bg-amber-600 transition-[width] duration-200"
                        style={{ width: `${lostWidth}%` }}
                      />
                    ) : null}
                    {foundWidth > 0 ? (
                      <div
                        className="h-full bg-primary transition-[width] duration-200"
                        style={{ width: `${foundWidth}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-border/75 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
              <span>{t('dashboard.lost')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span>{t('dashboard.found')}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Spacious 2-column analytics row for Lost & Found Officer:
 * - Col 1: Pure SVG Donut Chart for Items by Status with center total and legend.
 * - Col 2: Top Item Categories horizontal progress bars.
 */
export function OfficerCharts({
  analytics,
}: {
  analytics: OfficerDashboard['analytics'];
}) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('dashboard.statusDistribution')}
      className="grid gap-6 lg:grid-cols-2"
    >
      <ItemsByStatusDonutCard itemsByStatus={analytics.itemsByStatus} />
      <TopItemCategoriesCard itemsByCategory={analytics.itemsByCategory} />
    </section>
  );
}
