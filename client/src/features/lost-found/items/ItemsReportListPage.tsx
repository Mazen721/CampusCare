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
import {
  ACTIVE_BROWSE_STATUSES,
  ARCHIVED_ITEM_STATUSES,
  type ItemStatus,
  type ReportType,
} from '@/types/lostFound';

const PAGE_SIZE = 10;

interface ItemsReportListPageProps {
  scope: 'mine' | 'all' | 'archived';
}

type ViewFilter = 'all' | 'active' | 'archived';

export function ItemsReportListPage({ scope }: ItemsReportListPageProps) {
  const isMine = scope === 'mine';
  const [viewFilter, setViewFilter] = useState<ViewFilter>(
    scope === 'archived' ? 'archived' : 'all',
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reportType, setReportType] = useState<'ALL' | ReportType>('ALL');
  const [status, setStatus] = useState<'ALL' | ItemStatus>('ALL');
  const [page, setPage] = useState(1);

  const effectiveScope = isMine
    ? undefined
    : viewFilter === 'archived'
      ? 'archived'
      : viewFilter === 'active'
        ? 'active'
        : undefined;

  const itemsQuery = useQuery({
    queryKey: [
      'lost-found-items',
      scope,
      viewFilter,
      { debouncedSearch, reportType, status, page },
    ],
    queryFn: () =>
      itemsApi.list({
        q: debouncedSearch || undefined,
        reportType: reportType === 'ALL' ? undefined : reportType,
        status: status === 'ALL' ? undefined : status,
        scope: effectiveScope,
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

  const title = isMine
    ? 'My reports'
    : viewFilter === 'archived'
      ? 'Archived & resolved items'
      : viewFilter === 'active'
        ? 'Available lost & found items'
        : 'All reports';

  const description = isMine
    ? 'Track the lost and found reports you have submitted and close a lost report when it is resolved.'
    : viewFilter === 'archived'
      ? 'Previous lost and found items that have been returned, closed, or approved for handover and removed from public browse.'
      : viewFilter === 'active'
        ? 'Items currently active and visible to students in the public browse view.'
        : 'Review every lost and found report submitted across campus.';

  const emptyTitle = isMine
    ? 'You have not reported any items yet'
    : viewFilter === 'archived'
      ? 'No archived items yet'
      : viewFilter === 'active'
        ? 'No active items available'
        : 'No reports yet';

  const emptyDescription = isMine
    ? 'Report a lost or found item and it will appear here for you to track.'
    : viewFilter === 'archived'
      ? 'Items that are returned or closed will appear here after leaving the main browse page.'
      : viewFilter === 'active'
        ? 'When items are reported and awaiting claim, they will appear here.'
        : 'Reports submitted by campus users will appear here.';

  const allowedStatuses = isMine
    ? undefined
    : viewFilter === 'archived'
      ? ARCHIVED_ITEM_STATUSES
      : viewFilter === 'active'
        ? ACTIVE_BROWSE_STATUSES
        : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lost & Found"
        title={title}
        description={description}
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

      {!isMine && (
        <div className="flex flex-wrap items-center gap-2 border-b pb-3" role="tablist">
          <Button
            type="button"
            size="sm"
            variant={viewFilter === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setViewFilter('all');
              setStatus('ALL');
              setPage(1);
            }}
          >
            All reports
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewFilter === 'active' ? 'default' : 'outline'}
            onClick={() => {
              setViewFilter('active');
              setStatus('ALL');
              setPage(1);
            }}
          >
            Available in browse
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewFilter === 'archived' ? 'default' : 'outline'}
            onClick={() => {
              setViewFilter('archived');
              setStatus('ALL');
              setPage(1);
            }}
          >
            Archived (Previous items)
          </Button>
        </div>
      )}

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
        allowedStatuses={allowedStatuses}
        page={page}
        limit={PAGE_SIZE}
        total={itemsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
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
