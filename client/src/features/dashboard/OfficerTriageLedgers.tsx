import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { GitCompareArrows, Handshake, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { ClaimRecord } from '@/types/claims';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';
import type { ItemMatch } from '@/types/matches';

type OfficerTriageTab = 'claims' | 'matches';

interface TriageRowData {
  id: string;
  to: string;
  title: string;
  code: string;
  location: string;
  date: string;
  actionLabel: string;
  badge:
    | { kind: 'status'; status: string }
    | { kind: 'match'; score: number; level: ItemMatch['level'] };
}

interface PipelineStage {
  key: string;
  label: string;
  count: number;
  pct: number;
  barClass: string;
}

function buildClaimRows(claims: ClaimRecord[], t: TFunction): TriageRowData[] {
  const fallbackLocation = t('common.none');

  return claims.map((claim) => {
    const title = claim.item ? tr(claim.item, 'itemTitle') : t('dashboard.unknownItem');
    const itemLocation = claim.item?.location ? formatLocation(claim.item.location) : '';
    const claimantName = claim.claimant ? tr(claim.claimant, 'name') : '';
    const location = itemLocation || claimantName || fallbackLocation;

    return {
      id: `claim-${claim.id}`,
      to: `/lost-found/claims/${claim.id}`,
      title,
      code: claim.claimNumber,
      location,
      date: claim.createdAt,
      actionLabel:
        claim.status === 'APPROVED' ? t('dashboard.actionHandover') : t('dashboard.actionVerify'),
      badge: { kind: 'status', status: claim.status },
    };
  });
}

function buildMatchRows(matches: ItemMatch[], t: TFunction): TriageRowData[] {
  const fallbackLocation = t('common.none');

  return matches.map((match) => {
    const lostTitle = match.lostItem ? tr(match.lostItem, 'itemTitle') : t('dashboard.unknownItem');
    const foundTitle = match.foundItem
      ? tr(match.foundItem, 'itemTitle')
      : t('dashboard.unknownItem');
    const lostCode = match.lostItem?.reportNumber ?? '—';
    const foundCode = match.foundItem?.reportNumber ?? '—';
    const location =
      (match.foundItem?.location ? formatLocation(match.foundItem.location) : '') ||
      (match.lostItem?.location ? formatLocation(match.lostItem.location) : '') ||
      fallbackLocation;

    return {
      id: `match-${match.id}`,
      to: '/lost-found/matches',
      title: `${lostTitle} ↔ ${foundTitle}`,
      code: `${lostCode} ↔ ${foundCode}`,
      location,
      date: match.createdAt,
      actionLabel: t('dashboard.actionCompare'),
      badge: { kind: 'match', score: Math.round(match.score), level: match.level },
    };
  });
}

function buildPipelineStages(
  counts: OfficerDashboardData['counts'],
  t: TFunction,
): PipelineStage[] {
  const total = counts.openLostItems + counts.openFoundItems + counts.completedHandovers;
  const pctFor = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return [
    {
      key: 'unmatched-lost',
      label: t('dashboard.unmatchedLostReports'),
      count: counts.openLostItems,
      pct: pctFor(counts.openLostItems),
      barClass: 'bg-primary',
    },
    {
      key: 'verified-inventory',
      label: t('dashboard.verifiedInventory'),
      count: counts.openFoundItems,
      pct: pctFor(counts.openFoundItems),
      barClass: 'bg-amber-600',
    },
    {
      key: 'returned-items',
      label: t('dashboard.returnedItemsPipeline'),
      count: counts.completedHandovers,
      pct: pctFor(counts.completedHandovers),
      barClass: 'bg-emerald-600',
    },
  ];
}

function TriageTabButton({
  selected,
  label,
  count,
  onClick,
}: {
  selected: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span>{label}</span>
      <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
        {formatNumber(count)}
      </span>
    </button>
  );
}

function OfficerTriageRow({ item }: { item: TriageRowData }) {
  const { t } = useTranslation();

  return (
    <li className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-secondary/35 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <p dir="auto" className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span dir="ltr" className="font-mono font-medium tabular-nums">
            {item.code}
          </span>
          <span aria-hidden="true">•</span>
          <bdi className="truncate">{item.location}</bdi>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">{formatDate(item.date)}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {item.badge.kind === 'status' ? (
          <StatusBadge status={item.badge.status} />
        ) : (
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 tabular-nums',
              item.badge.level === 'STRONG'
                ? 'border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-700'
                : 'border-amber-500/30 bg-amber-500/[0.12] font-medium text-amber-800',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                item.badge.level === 'STRONG' ? 'bg-emerald-600' : 'bg-amber-600',
              )}
              aria-hidden="true"
            />
            {t('dashboard.matchScorePill', { score: formatNumber(item.badge.score) })}
          </Badge>
        )}

        <Link
          to={item.to}
          className="inline-flex h-8 items-center rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.actionLabel}
        </Link>
      </div>
    </li>
  );
}

function RecoveryPipelinePanel({ counts }: { counts: OfficerDashboardData['counts'] }) {
  const { t } = useTranslation();
  const stages = buildPipelineStages(counts, t);

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-4">
      <div className="space-y-5">
        <div className="border-b border-border/75 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground">
            <Handshake className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t('dashboard.recoveryPipelineTitle')}</span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t('dashboard.recoveryPipelineDesc')}
          </p>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{stage.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
                  {formatNumber(stage.count)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-200', stage.barClass)}
                  style={{ width: `${Math.max(0, Math.min(100, stage.pct))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/lost-found/handovers"
        className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-secondary/45 px-4 py-3 text-xs transition-colors hover:bg-secondary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <ShieldCheck
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              counts.claimsAwaitingHandover > 0 ? 'text-emerald-600' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <span>{t('dashboard.awaitingHandover')}</span>
        </span>
        <span
          className={cn(
            'font-bold tabular-nums',
            counts.claimsAwaitingHandover > 0 ? 'text-emerald-700' : 'text-foreground',
          )}
        >
          {formatNumber(counts.claimsAwaitingHandover)}
        </span>
      </Link>
    </div>
  );
}

interface OfficerTriageLedgersProps {
  counts: OfficerDashboardData['counts'];
}

/**
 * Spacious 12-column Bento workspace pairing a tabbed Claims & AI Matches
 * triage queue (8 cols) with a Recovery Pipeline secondary rail (4 cols).
 */
export function OfficerTriageLedgers({ counts }: OfficerTriageLedgersProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OfficerTriageTab>('claims');

  const claimsQuery = useQuery({
    queryKey: ['lost-found-claims', 'officer-dashboard-triage'],
    queryFn: async () => {
      const [verifying, pending, approved] = await Promise.all([
        claimsApi.list({ status: 'UNDER_VERIFICATION', limit: 5 }),
        claimsApi.list({ status: 'PENDING_REVIEW', limit: 5 }),
        claimsApi.list({ status: 'APPROVED', limit: 5 }),
      ]);
      const items = [...verifying.data, ...pending.data, ...approved.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      return {
        items,
        total: verifying.total + pending.total + approved.total,
      };
    },
  });

  const matchesQuery = useQuery({
    queryKey: ['lost-found-matches', 'officer-dashboard-triage'],
    queryFn: () => matchesApi.list({ status: 'SUGGESTED', limit: 5 }),
  });

  const claimRows = buildClaimRows(claimsQuery.data?.items ?? [], t);
  const matchRows = buildMatchRows(matchesQuery.data?.data ?? [], t);

  const claimsTotal =
    claimsQuery.data?.total ??
    counts.pendingClaims + counts.underVerificationClaims + counts.claimsAwaitingHandover;
  const matchesTotal = matchesQuery.data?.total ?? counts.pendingMatches;

  const isLoading =
    activeTab === 'claims' ? claimsQuery.isLoading : matchesQuery.isLoading;
  const activeError =
    activeTab === 'claims'
      ? claimsQuery.error
        ? getErrorMessage(claimsQuery.error)
        : null
      : matchesQuery.error
        ? getErrorMessage(matchesQuery.error)
        : null;
  const rows = activeTab === 'claims' ? claimRows : matchRows;

  return (
    <section
      aria-label={t('dashboard.officerTriageTitle')}
      className="grid gap-6 lg:grid-cols-12"
    >
      <div className="flex min-w-0 flex-col rounded-xl border border-border/80 bg-card shadow-xs lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/75 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
              {t('dashboard.officerTriageTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('dashboard.officerTriageDesc')}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={t('dashboard.officerTriageTitle')}
            className="inline-flex rounded-lg border border-border/80 bg-secondary/50 p-1 text-xs"
          >
            <TriageTabButton
              selected={activeTab === 'claims'}
              label={t('dashboard.activeClaimsQueueTab')}
              count={claimsTotal}
              onClick={() => setActiveTab('claims')}
            />
            <TriageTabButton
              selected={activeTab === 'matches'}
              label={t('dashboard.aiSuggestedMatchesTab')}
              count={matchesTotal}
              onClick={() => setActiveTab('matches')}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {isLoading ? (
            <LoadingState
              label={t('common.loading')}
              className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
            />
          ) : activeError ? (
            <ErrorState
              message={activeError}
              onRetry={() => {
                if (activeTab === 'claims') {
                  void claimsQuery.refetch();
                } else {
                  void matchesQuery.refetch();
                }
              }}
              className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={
                activeTab === 'claims'
                  ? t('claims.noClaimsFound')
                  : t('matches.noMatchesFound')
              }
              description={
                activeTab === 'claims'
                  ? t('dashboard.noActiveClaimsDesc')
                  : t('dashboard.noSuggestedMatchesDesc')
              }
              icon={activeTab === 'claims' ? ShieldCheck : GitCompareArrows}
              className="min-h-[240px] flex-1 border-0 bg-transparent px-6 py-8"
            />
          ) : (
            <ul className="divide-y divide-border/75">
              {rows.map((item) => (
                <OfficerTriageRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/75 px-6 py-3">
          <span className="text-xs tabular-nums text-muted-foreground">
            {activeTab === 'claims'
              ? `${formatNumber(counts.claimsAwaitingHandover)} ${t('dashboard.awaitingHandover')}`
              : `${formatNumber(matchesTotal)} ${t('dashboard.pendingMatchesLabel')}`}
          </span>
          <PortalViewAllLink
            to={activeTab === 'claims' ? '/lost-found/claims' : '/lost-found/matches'}
            label={t('common.viewAll')}
          />
        </div>
      </div>

      <RecoveryPipelinePanel counts={counts} />
    </section>
  );
}
