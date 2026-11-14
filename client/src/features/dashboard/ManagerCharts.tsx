import { useTranslation } from 'react-i18next';
import { tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { formatNumber } from '@/lib/utils';
import type { ManagerMetrics } from '@/types/dashboard';
import { REQUEST_STATUSES, type RequestStatus } from '@/types/meta';

const STATUS_DONUT_COLOR: Record<RequestStatus, { strokeClass: string; dotClass: string }> = {
  COMPLETED: { strokeClass: 'stroke-emerald-600', dotClass: 'bg-emerald-600' },
  CLOSED: { strokeClass: 'stroke-emerald-500', dotClass: 'bg-emerald-500' },
  APPROVED: { strokeClass: 'stroke-emerald-700', dotClass: 'bg-emerald-700' },
  IN_PROGRESS: { strokeClass: 'stroke-primary', dotClass: 'bg-primary' },
  SUBMITTED: { strokeClass: 'stroke-primary/70', dotClass: 'bg-primary/70' },
  UNDER_REVIEW: { strokeClass: 'stroke-amber-600', dotClass: 'bg-amber-600' },
  REOPENED: { strokeClass: 'stroke-amber-500', dotClass: 'bg-amber-500' },
  REJECTED: { strokeClass: 'stroke-destructive', dotClass: 'bg-destructive' },
};

const DONUT_RADIUS = 15.91549430918954;

interface DonutSegment {
  status: RequestStatus;
  label: string;
  count: number;
  pct: number;
  roundedPct: number;
  offset: number;
  strokeClass: string;
  dotClass: string;
}

function buildDonutSegments(metrics: ManagerMetrics): DonutSegment[] {
  const statusEntries = REQUEST_STATUSES.map((status) => ({
    status,
    label: enumLabel('status', status),
    count: metrics.requestsByStatus[status] ?? 0,
    ...STATUS_DONUT_COLOR[status],
  })).filter((entry) => entry.count > 0);

  const totalRequests = metrics.totalRequests;
  let cumulativePct = 0;

  return statusEntries.map((entry) => {
    const pct = totalRequests > 0 ? (entry.count / totalRequests) * 100 : 0;
    const offset = -cumulativePct;
    cumulativePct += pct;
    return {
      ...entry,
      pct,
      roundedPct: Math.round(pct),
      offset,
    };
  });
}

function RequestsStatusDonutCard({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();
  const totalRequests = metrics.totalRequests;
  const donutSegments = buildDonutSegments(metrics);
  const inProgressCount = metrics.requestsByStatus.IN_PROGRESS ?? 0;
  const resolvedCount =
    (metrics.requestsByStatus.COMPLETED ?? 0) + (metrics.requestsByStatus.CLOSED ?? 0);

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {t('dashboard.requestsByStatusTitle')}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('dashboard.requestsByStatusDesc', {
            total: formatNumber(totalRequests),
          })}
        </p>
      </div>

      {totalRequests === 0 || donutSegments.length === 0 ? (
        <p className="mt-5 flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
          {t('dashboard.noRequestsInPeriod')}
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
              <svg
                className="h-40 w-40 -rotate-90"
                viewBox="0 0 36 36"
                role="img"
                aria-label={t('dashboard.requestsByStatusTitle')}
              >
                <circle
                  cx="18"
                  cy="18"
                  r={DONUT_RADIUS}
                  fill="transparent"
                  className="stroke-secondary"
                  strokeWidth="3.8"
                />
                {donutSegments.map((segment) => (
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
                  {formatNumber(totalRequests)}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                  {t('dashboard.requests')}
                </span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-2 text-xs">
              {donutSegments.map((segment) => (
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
                {t('dashboard.inProgress')}:{' '}
                <strong className="font-semibold tabular-nums text-foreground">
                  {formatNumber(inProgressCount)}
                </strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              <span>
                {t('dashboard.completed')}:{' '}
                <strong className="font-semibold tabular-nums text-foreground">
                  {formatNumber(resolvedCount)}
                </strong>
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function TechnicianWorkloadCard({
  technicians,
}: {
  technicians: ManagerMetrics['technicianWorkload'];
}) {
  const { t } = useTranslation();
  const workloadList = [...technicians]
    .sort(
      (a, b) =>
        b.activeWorkOrders +
        b.completedWorkOrders -
        (a.activeWorkOrders + a.completedWorkOrders),
    )
    .slice(0, 5);

  const maxWorkload = Math.max(
    ...workloadList.map((tech) => tech.activeWorkOrders + tech.completedWorkOrders),
    1,
  );

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {t('dashboard.technicianWorkload')}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('dashboard.technicianWorkloadDesc')}
        </p>
      </div>

      {workloadList.length === 0 ? (
        <p className="mt-5 flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-secondary/35 px-4 text-center text-sm text-muted-foreground">
          {t('technicians.noTechniciansFound')}
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-3 text-xs">
            {workloadList.map((technician) => {
              const displayName = tr(technician, 'name') || technician.name;
              const activeWidth = (technician.activeWorkOrders / maxWorkload) * 100;
              const completedWidth = (technician.completedWorkOrders / maxWorkload) * 100;

              return (
                <div key={technician.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 font-medium">
                    <span dir="auto" className="truncate text-foreground">
                      {displayName}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {t('dashboard.workloadMeta', {
                        active: formatNumber(technician.activeWorkOrders),
                        completed: formatNumber(technician.completedWorkOrders),
                      })}
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    {activeWidth > 0 ? (
                      <div
                        className="h-full bg-primary transition-[width] duration-200"
                        style={{ width: `${activeWidth}%` }}
                      />
                    ) : null}
                    {completedWidth > 0 ? (
                      <div
                        className="h-full bg-emerald-600 transition-[width] duration-200"
                        style={{ width: `${completedWidth}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-border/75 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span>{t('dashboard.active')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              <span>{t('dashboard.completed')}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Spacious 2-column analytics row:
 * - Col 1: Pure SVG Donut Chart for Requests by Status with center total and clean side legend.
 * - Col 2: Technician Workload horizontal progress bars.
 */
export function ManagerCharts({ metrics }: { metrics: ManagerMetrics }) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('dashboard.statusDistribution')}
      className="grid gap-6 lg:grid-cols-2"
    >
      <RequestsStatusDonutCard metrics={metrics} />
      <TechnicianWorkloadCard technicians={metrics.technicianWorkload} />
    </section>
  );
}
