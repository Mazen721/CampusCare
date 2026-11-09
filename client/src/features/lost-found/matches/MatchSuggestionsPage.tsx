import { GitCompareArrows } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { MatchActions } from '@/features/lost-found/matches/MatchActions';
import { MatchScoreSummary } from '@/features/lost-found/matches/MatchScoreSummary';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { humanizeEnum } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import {
  MATCH_STATUSES,
  type ItemMatch,
  type MatchStatus,
} from '@/types/matches';

const PAGE_SIZE = 10;

export function MatchSuggestionsPage() {
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
      header: 'Match',
      cell: (match) => <MatchScoreSummary match={match} />,
    },
    {
      id: 'lost',
      header: 'Lost report',
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
              {match.lostItem.itemTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(match.lostItem.occurrenceDate)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        ),
    },
    {
      id: 'found',
      header: 'Found report',
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
              {match.foundItem.itemTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {match.foundItem.location?.buildingName ?? match.foundItem.locationDetails}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        ),
    },
    {
      id: 'created',
      header: 'Suggested',
      cell: (match) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(match.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (match) => <MatchActions match={match} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lost & Found"
        title="Match suggestions"
        description="Deterministic suggestions from category, location, date, colour, brand and keywords. Confirm a match to let the owner submit a claim."
      />

      <DataTable
        columns={columns}
        data={matchesQuery.data?.data ?? []}
        rowKey={(match) => match.id}
        isLoading={matchesQuery.isLoading}
        error={
          matchesQuery.isError
            ? 'Unable to load match suggestions. Check your connection and try again.'
            : null
        }
        onRetry={() => void matchesQuery.refetch()}
        filters={[
          {
            id: 'match-status',
            label: 'Status',
            value: status,
            options: [
              { label: 'All statuses', value: 'ALL' },
              ...MATCH_STATUSES.map((value) => ({
                label: humanizeEnum(value),
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
        emptyTitle="No match suggestions"
        emptyDescription="New reports are scored automatically when they are created. Recalculate an item if you need to refresh its suggestions."
      />
    </div>
  );
}
