import { GitCompareArrows } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { MatchActions } from '@/features/lost-found/matches/MatchActions';
import { MatchScoreSummary } from '@/features/lost-found/matches/MatchScoreSummary';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { formatLocation, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import {
  MATCH_STATUSES,
  type ItemMatch,
  type MatchStatus,
} from '@/types/matches';

const PAGE_SIZE = 10;

export function MatchSuggestionsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'ALL' | MatchStatus>('SUGGESTED');
  const [page, setPage] = useState(1);

  const matchesQuery = useQuery({
    queryKey: ['lost-found-matches', status, page],
    queryFn: () =>
      matchesApi.list({
        status: status === 'ALL' ? undefined : status,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const columns: Array<DataTableColumn<ItemMatch>> = [
    {
      id: 'match',
      header: t('matches.matchScore'),
      cell: (match) => <MatchScoreSummary match={match} />,
    },
    {
      id: 'lost',
      header: t('matches.lostItem'),
      cell: (match) =>
        match.lostItem ? (
          <div className="min-w-0">
            <Link
              to={`/lost-found/items/${match.lostItem.id}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              <span dir="ltr">{match.lostItem.reportNumber}</span>
            </Link>
            <p className="mt-0.5 max-w-[220px] truncate text-sm font-medium text-foreground">
              {tr(match.lostItem, 'itemTitle')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(match.lostItem.occurrenceDate)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
        ),
    },
    {
      id: 'found',
      header: t('matches.foundItem'),
      cell: (match) =>
        match.foundItem ? (
          <div className="min-w-0">
            <Link
              to={`/lost-found/items/${match.foundItem.id}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              <span dir="ltr">{match.foundItem.reportNumber}</span>
            </Link>
            <p className="mt-0.5 max-w-[220px] truncate text-sm font-medium text-foreground">
              {tr(match.foundItem, 'itemTitle')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {match.foundItem.location
                ? formatLocation(match.foundItem.location)
                : tr(match.foundItem, 'locationDetails')}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
        ),
    },
    {
      id: 'created',
      header: t('common.date'),
      cell: (match) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(match.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (match) => <MatchActions match={match} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.lostFound')}
        title={t('matches.title')}
        description={t('matches.subtitle')}
      />

      <DataTable
        columns={columns}
        data={matchesQuery.data?.data ?? []}
        rowKey={(match) => match.id}
        isLoading={matchesQuery.isLoading}
        error={
          matchesQuery.isError
            ? t('errors.network')
            : null
        }
        onRetry={() => void matchesQuery.refetch()}
        filters={[
          {
            id: 'match-status',
            label: t('common.status'),
            value: status,
            options: [
              { label: t('common.all'), value: 'ALL' },
              ...MATCH_STATUSES.map((value) => ({
                label: enumLabel('status', value),
                value,
              })),
            ],
            onChange: (value) => {
              setStatus(value as 'ALL' | MatchStatus);
              setPage(1);
            },
          },
        ]}
        page={page}
        limit={PAGE_SIZE}
        total={matchesQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={GitCompareArrows}
        emptyTitle={t('matches.noMatchesFound')}
        emptyDescription={t('matches.noMatchesFound')}
      />
    </div>
  );
}
