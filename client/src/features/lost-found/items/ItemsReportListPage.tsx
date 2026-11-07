import { PackagePlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { ReportsTable } from '@/features/lost-found/items/ReportsTable';
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { ItemStatus, ReportType } from '@/types/lostFound';

const PAGE_SIZE = 10;

interface ItemsReportListPageProps {
  scope: 'mine' | 'all';
}

export function ItemsReportListPage({ scope }: ItemsReportListPageProps) {
  const isMine = scope === 'mine';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reportType, setReportType] = useState<'ALL' | ReportType>('ALL');
  const [status, setStatus] = useState<'ALL' | ItemStatus>('ALL');
  const [page, setPage] = useState(1);

  const itemsQuery = useQuery({
    queryKey: ['lost-found-items', scope, { debouncedSearch, reportType, status, page }],
    queryFn: () =>
      itemsApi.list({
        q: debouncedSearch || undefined,
        reportType: reportType === 'ALL' ? undefined : reportType,
        status: status === 'ALL' ? undefined : status,
        mine: isMine ? true : undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const errorMessage =
    itemsQuery.error instanceof ApiError
      ? itemsQuery.error.message
      : itemsQuery.error
        ? 'Unable to load lost and found reports right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lost & Found"
        title={isMine ? 'My reports' : 'All reports'}
        description={
          isMine
            ? 'Track the lost and found reports you have submitted and close a lost report when it is resolved.'
            : 'Review every lost and found report submitted across campus.'
        }
        actions={
          isMine ? (
            <Button asChild>
              <Link to="/lost-found/report">
                <PackagePlus className="h-4 w-4" aria-hidden="true" />
                Report an item
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ReportsTable
        data={itemsQuery.data?.data ?? []}
        isLoading={itemsQuery.isLoading}
        error={errorMessage}
        onRetry={() => void itemsQuery.refetch()}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        reportType={reportType}
        onReportTypeChange={(value) => {
          setReportType(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        page={page}
        limit={PAGE_SIZE}
        total={itemsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyTitle={isMine ? 'You have not reported any items yet' : 'No reports yet'}
        emptyDescription={
          isMine
            ? 'Report a lost or found item and it will appear here for you to track.'
            : 'Reports submitted by campus users will appear here.'
        }
        emptyAction={
          isMine ? (
            <Button asChild size="sm">
              <Link to="/lost-found/report">Report an item</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
