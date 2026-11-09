import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatDate } from '@/lib/utils';
import {
  PRIORITIES,
  REQUEST_STATUSES,
  type Priority,
  type RequestStatus,
} from '@/types/meta';
import type { MaintenanceRequestRecord } from '@/types/maintenance';

const PAGE_SIZE = 10;

export function RequestsListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [page, setPage] = useState(1);

  const isStudent = user?.role === 'STUDENT_EMPLOYEE';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const requestsQuery = useQuery({
    queryKey: [
      'requests',
      { page, search: debouncedSearch, statusFilter, priorityFilter, scope: user?.role },
    ],
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
            {request.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span dir="ltr">{request.requestNumber}</span>
            {isAdmin && request.requester ? (
              <>
                {' · '}
                <bdi>{request.requester.name}</bdi>
              </>
            ) : ''}
          </p>
        </div>
      ),
    },
    {
      id: 'category',
      header: t('common.category'),
      cell: (request) => (
        <span className="text-sm text-muted-foreground">
          {enumLabel('maintenanceCategory', request.category)}
        </span>
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
            {request.location.buildingName} · {request.location.floor} · {request.location.room}
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
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/maintenance/requests/${request.id}`}>
            {t('common.view')}
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ];

  const errorMessage = requestsQuery.error ? getErrorMessage(requestsQuery.error, t('errors.network')) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.maintenance')}
        title={isStudent ? t('requests.myRequests') : t('requests.title')}
        description={
          isStudent
            ? t('requests.myRequestsDescription')
            : t('requests.allRequestsDescription')
        }
        actions={
          isStudent ? (
            <Button asChild>
              <Link to="/maintenance/requests/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('requests.newRequest')}
              </Link>
            </Button>
          ) : undefined
        }
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
        emptyIcon={ClipboardList}
        emptyTitle={search ? t('requests.noMatchingRequests') : t('requests.noRequestsYet')}
        emptyDescription={
          search
            ? t('requests.noMatchingDesc')
            : isStudent
              ? t('requests.noRequestsStudent')
              : t('requests.noRequestsAdmin')
        }
        emptyAction={
          isStudent ? (
            <Button asChild size="sm">
              <Link to="/maintenance/requests/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('requests.newRequest')}
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
