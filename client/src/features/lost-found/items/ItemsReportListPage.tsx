import { PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { ReportsTable } from '@/features/lost-found/items/ReportsTable';
import { getErrorMessage } from '@/lib/api';
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isMine = scope === 'mine';
  const paramType = searchParams.get('type');
  const initialReportType: 'ALL' | ReportType =
    scope === 'all' && (paramType === 'LOST' || paramType === 'FOUND') ? paramType : 'ALL';
  const [viewFilter, setViewFilter] = useState<ViewFilter>(
    scope === 'archived' ? 'archived' : 'all',
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reportType, setReportType] = useState<'ALL' | ReportType>(initialReportType);
  const [status, setStatus] = useState<'ALL' | ItemStatus>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (scope !== 'all') return;
    const nextType: 'ALL' | ReportType =
      paramType === 'LOST' || paramType === 'FOUND' ? paramType : 'ALL';
    setReportType(nextType);
    setPage(1);
  }, [paramType, scope]);

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

  const errorMessage = itemsQuery.error ? getErrorMessage(itemsQuery.error) : null;

  const title = isMine
    ? t('lostFound.myReportsTitle')
    : viewFilter === 'archived'
      ? t('lostFound.archivedTitle')
      : viewFilter === 'active'
        ? t('lostFound.availableTitle')
        : t('lostFound.allReportsTitle');

  const description = isMine
    ? t('lostFound.myReportsDescription')
    : viewFilter === 'archived'
      ? t('lostFound.archivedDescription')
      : viewFilter === 'active'
        ? t('lostFound.availableDescription')
        : t('lostFound.allReportsDescription');

  const emptyTitle = isMine
    ? t('lostFound.noReportsMine')
    : viewFilter === 'archived'
      ? t('lostFound.noArchivedYet')
      : viewFilter === 'active'
        ? t('lostFound.noActiveAvailable')
        : t('lostFound.noReportsYet');

  const emptyDescription = isMine
    ? t('lostFound.noReportsMineDesc')
    : viewFilter === 'archived'
      ? t('lostFound.noArchivedDesc')
      : viewFilter === 'active'
        ? t('lostFound.noActiveAvailableDesc')
        : t('lostFound.allReports');

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
        eyebrow={t('lostFound.title')}
        title={title}
        description={description}
        actions={
          isMine ? (
            <Button asChild>
              <Link to="/lost-found/report">
                <PackagePlus className="h-4 w-4" aria-hidden="true" />
                {t('lostFound.reportAnItem')}
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
            {t('lostFound.allReportsTab')}
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
            {t('lostFound.availableInBrowse')}
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
            {t('lostFound.archivedPrevious')}
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
              <Link to="/lost-found/report">{t('lostFound.reportAnItem')}</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
