import type { LucideIcon } from 'lucide-react';
import { ChevronRight, GitCompareArrows, Handshake, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PortalLedgerCard } from '@/features/dashboard/PortalLedgerCard';
import { PortalLedgerRow } from '@/features/dashboard/PortalLedgerRow';
import { PortalViewAllLink } from '@/features/dashboard/PortalViewAllLink';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import type { OfficerDashboard as OfficerDashboardData } from '@/types/dashboard';

interface TriageSummaryStripProps {
  to: string;
  icon: LucideIcon;
  count: number;
  label: string;
  summary: ReactNode;
}

function TriageSummaryStrip({
  to,
  icon: Icon,
  count,
  label,
  summary,
}: TriageSummaryStripProps) {
  const active = count > 0;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/75 pb-3 text-xs">
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active
            ? 'border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] text-[hsl(var(--mnu-navy))] hover:border-[hsl(var(--mnu-gold))]'
            : 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            active ? 'text-[hsl(var(--mnu-gold-ink))]' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />
        <span>
          <span className="font-semibold tabular-nums">{formatNumber(count)}</span> {label}
        </span>
        <ChevronRight className="h-3.5 w-3.5 opacity-75 rtl:rotate-180" aria-hidden="true" />
      </Link>
      <span className="tabular-nums text-muted-foreground">{summary}</span>
    </div>
  );
}

interface OfficerTriageLedgersProps {
  counts: OfficerDashboardData['counts'];
}

/**
 * Live two-column triage ledgers pairing active claims/handovers with
 * suggested lost-and-found matches for immediate officer action.
 */
export function OfficerTriageLedgers({ counts }: OfficerTriageLedgersProps) {
  const { t } = useTranslation();

  const claimsQuery = useQuery({
    queryKey: ['lost-found-claims', 'officer-dashboard-triage'],
    queryFn: async () => {
      const [verifying, pending, approved] = await Promise.all([
        claimsApi.list({ status: 'UNDER_VERIFICATION', limit: 5 }),
        claimsApi.list({ status: 'PENDING_REVIEW', limit: 5 }),
        claimsApi.list({ status: 'APPROVED', limit: 5 }),
      ]);
      return [...verifying.data, ...pending.data, ...approved.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    },
  });

  const matchesQuery = useQuery({
    queryKey: ['lost-found-matches', 'officer-dashboard-triage'],
    queryFn: () => matchesApi.list({ status: 'SUGGESTED', limit: 5 }),
  });

  const actionableClaims = claimsQuery.data ?? [];
  const suggestedMatches = matchesQuery.data?.data ?? [];

  const claimsError = claimsQuery.error ? getErrorMessage(claimsQuery.error) : null;
  const matchesError = matchesQuery.error ? getErrorMessage(matchesQuery.error) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PortalLedgerCard
        title={t('dashboard.claimsTriageTitle')}
        description={t('dashboard.claimsTriageDesc')}
        icon={ShieldCheck}
        headerAction={<PortalViewAllLink to="/lost-found/claims" label={t('common.viewAll')} />}
        subHeader={
          <TriageSummaryStrip
            to="/lost-found/handovers"
            icon={Handshake}
            count={counts.claimsAwaitingHandover}
            label={t('dashboard.awaitingHandover')}
            summary={
              <>
                <strong className="font-semibold text-foreground">
                  {formatNumber(counts.completedHandovers)}
                </strong>{' '}
                {t('dashboard.completedHandovers')}
              </>
            }
          />
        }
        isLoading={claimsQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={claimsError}
        onRetry={() => void claimsQuery.refetch()}
        isEmpty={actionableClaims.length === 0}
        emptyTitle={t('claims.noClaimsFound')}
        emptyDescription={t('dashboard.noActiveClaimsDesc')}
        emptyIcon={ShieldCheck}
        emptyAction={{
          label: t('dashboard.viewClaims'),
          to: '/lost-found/claims',
        }}
      >
        <ul className="divide-y divide-border/75">
          {actionableClaims.map((claim) => {
            const title = claim.item ? tr(claim.item, 'itemTitle') : t('dashboard.unknownItem');
            return (
              <PortalLedgerRow
                key={claim.id}
                to={`/lost-found/claims/${claim.id}`}
                title={title}
                code={claim.claimNumber}
                metaItems={claim.claimant?.name ? [claim.claimant.name] : undefined}
                date={claim.createdAt}
                badges={<StatusBadge status={claim.status} className="shrink-0" />}
              />
            );
          })}
        </ul>
      </PortalLedgerCard>

      <PortalLedgerCard
        title={t('dashboard.suggestedMatchesTitle')}
        description={t('dashboard.suggestedMatchesDesc')}
        icon={GitCompareArrows}
        headerAction={<PortalViewAllLink to="/lost-found/matches" label={t('common.viewAll')} />}
        subHeader={
          <TriageSummaryStrip
            to="/lost-found/matches"
            icon={GitCompareArrows}
            count={counts.pendingMatches}
            label={t('dashboard.pendingMatchesLabel')}
            summary={
              <>
                <strong className="font-semibold text-foreground">
                  {formatNumber(counts.openLostItems)}
                </strong>{' '}
                {t('dashboard.lost')} ·{' '}
                <strong className="font-semibold text-foreground">
                  {formatNumber(counts.openFoundItems)}
                </strong>{' '}
                {t('dashboard.found')}
              </>
            }
          />
        }
        isLoading={matchesQuery.isLoading}
        loadingLabel={t('common.loading')}
        error={matchesError}
        onRetry={() => void matchesQuery.refetch()}
        isEmpty={suggestedMatches.length === 0}
        emptyTitle={t('matches.noMatchesFound')}
        emptyDescription={t('dashboard.noSuggestedMatchesDesc')}
        emptyIcon={GitCompareArrows}
        emptyAction={{
          label: t('lostFound.allReports'),
          to: '/lost-found/items',
        }}
      >
        <ul className="divide-y divide-border/75">
          {suggestedMatches.map((match) => {
            const lostTitle = match.lostItem
              ? tr(match.lostItem, 'itemTitle')
              : t('dashboard.unknownItem');
            const foundTitle = match.foundItem
              ? tr(match.foundItem, 'itemTitle')
              : t('dashboard.unknownItem');
            const lostCode = match.lostItem?.reportNumber ?? '—';
            const foundCode = match.foundItem?.reportNumber ?? '—';
            const locationText = match.foundItem?.location
              ? formatLocation(match.foundItem.location)
              : undefined;
            const scoreValue = Math.round(match.score);

            return (
              <PortalLedgerRow
                key={match.id}
                to="/lost-found/matches"
                title={`${lostTitle} ↔ ${foundTitle}`}
                code={`${lostCode} ↔ ${foundCode}`}
                date={match.createdAt}
                location={locationText}
                badges={
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 tabular-nums',
                      match.level === 'STRONG'
                        ? 'border-[hsl(var(--mnu-gold)/0.6)] bg-[hsl(var(--mnu-gold-tint))] font-semibold text-[hsl(var(--mnu-navy))]'
                        : 'border-border bg-secondary font-medium text-secondary-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        match.level === 'STRONG'
                          ? 'bg-[hsl(var(--mnu-gold-ink))]'
                          : 'bg-muted-foreground',
                      )}
                      aria-hidden="true"
                    />
                    {t('dashboard.matchScorePill', { score: formatNumber(scoreValue) })}
                  </Badge>
                }
              />
            );
          })}
        </ul>
      </PortalLedgerCard>
    </div>
  );
}
