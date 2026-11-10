import { ClipboardCheck, Inbox } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ReviewRequestDialog } from '@/features/maintenance/requests/ReviewRequestDialog';
import { formatLocation, tr } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatDate } from '@/lib/utils';
import type { MaintenanceRequestRecord } from '@/types/maintenance';
import {
  PRIORITIES,
  REQUEST_STATUSES,
  type Priority,
  type RequestStatus,
} from '@/types/meta';

const PAGE_SIZE = 10;
const REVIEWABLE: RequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

export function RequestQueuePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MaintenanceRequestRecord | null>(null);

  const requestsQuery = useQuery({
    queryKey: ['requests', { queue: true, page, search: debouncedSearch, statusFilter, priorityFilter }],
    queryFn: () =>
      requestsApi.list({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      }),
  });

  const columns: Array<DataTableColumn<MaintenanceRequestRecord>> = [
    {
      id: 'request',
      header: t('requests.itemTitle'),
      cell: (request) => (
        <div className="min-w-0">
          <Link
            to={`/maintenance/requests/${request.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {tr(request, 'title')}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span dir="ltr">{request.requestNumber}</span>
          </p>
        </div>
      ),
    },
    {
      id: 'requester',
      header: t('requests.requester'),
      cell: (request) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {request.requester ? <bdi>{tr(request.requester, 'name')}</bdi> : '—'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {tr(request.requester, 'department') || (request.requester?.email ? <span dir="ltr">{request.requester.email}</span> : '')}
          </p>
        </div>
      ),
    },
    {
      id: 'priority',
      header: t('common.priority'),
      cell: (request) => <PriorityBadge priority={request.priority} />,
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (request) => <StatusBadge status={request.status} />,
    },
    {
      id: 'location',
      header: t('common.location'),
      cell: (request) =>
        request.location ? (
          <span className="text-sm text-muted-foreground">
            {formatLocation(request.location)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: 'created',
      header: t('requests.submittedOn'),
      cell: (request) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(request.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (request) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/maintenance/requests/${request.id}`}>{t('common.view')}</Link>
          </Button>
          {REVIEWABLE.includes(request.status) ? (
            <Button size="sm" onClick={() => setSelected(request)}>
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('requests.review')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const errorMessage = requestsQuery.error ? getErrorMessage(requestsQuery.error, t('errors.network')) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.maintenance')}
        title={t('requests.queue')}
        description={t('requests.queueDescription')}
      />

      <DataTable
        columns={columns}
        data={requestsQuery.data?.data ?? []}
        rowKey={(request) => request.id}
        isLoading={requestsQuery.isLoading}
        error={errorMessage}
        onRetry={() => void requestsQuery.refetch()}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t('requests.searchPlaceholder')}
        filters={[
          {
            id: 'status',
            label: t('common.status'),
            value: statusFilter,
            options: [
              { label: t('requests.allStatuses'), value: 'ALL' },
              ...REQUEST_STATUSES.map((status) => ({
                label: enumLabel('status', status),
                value: status,
              })),
            ],
            onChange: (value) => {
              setStatusFilter(value as 'ALL' | RequestStatus);
              setPage(1);
            },
          },
          {
            id: 'priority',
            label: t('common.priority'),
            value: priorityFilter,
            options: [
              { label: t('requests.allPriorities'), value: 'ALL' },
              ...PRIORITIES.map((priority) => ({
                label: enumLabel('priority', priority),
                value: priority,
              })),
            ],
            onChange: (value) => {
              setPriorityFilter(value as 'ALL' | Priority);
              setPage(1);
            },
          },
        ]}
        page={page}
        limit={PAGE_SIZE}
        total={requestsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={Inbox}
        emptyTitle={search || statusFilter !== 'ALL' ? t('requests.noMatchingRequests') : t('requests.queueClearTitle')}
        emptyDescription={
          search || statusFilter !== 'ALL'
            ? t('requests.noMatchingDesc')
            : t('requests.queueClearDesc')
        }
      />

      <ReviewRequestDialog
        request={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
