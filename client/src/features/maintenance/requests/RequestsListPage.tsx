import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ApiError } from '@/lib/api';
import { humanizeEnum } from '@/lib/labels';
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
      header: 'Request',
      cell: (request) => (
        <div className="min-w-0">
          <Link
            to={`/maintenance/requests/${request.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {request.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.requestNumber}
            {isAdmin && request.requester ? ` · ${request.requester.name}` : ''}
          </p>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (request) => <span className="text-sm text-muted-foreground">{request.category}</span>,
    },
    {
      id: 'priority',
      header: 'Priority',
      cell: (request) => <PriorityBadge priority={request.priority} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (request) => <StatusBadge status={request.status} />,
    },
    {
      id: 'location',
      header: 'Location',
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
      header: 'Submitted',
      cell: (request) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(request.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (request) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/maintenance/requests/${request.id}`}>
            View
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ];

  const errorMessage =
    requestsQuery.error instanceof ApiError
      ? requestsQuery.error.message
      : requestsQuery.error
        ? 'Unable to load maintenance requests right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        title={isStudent ? 'My requests' : 'Maintenance requests'}
        description={
          isStudent
            ? 'Follow every request you have submitted, from manager review through to completion.'
            : 'A read-only view of every maintenance request across campus, ranked by priority.'
        }
        actions={
          isStudent ? (
            <Button asChild>
              <Link to="/maintenance/requests/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New request
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
        searchPlaceholder="Search request number, title or description…"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All statuses', value: 'ALL' },
              ...REQUEST_STATUSES.map((status) => ({
                label: humanizeEnum(status),
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
            label: 'Priority',
            value: priorityFilter,
            options: [
              { label: 'All priorities', value: 'ALL' },
              ...PRIORITIES.map((priority) => ({
                label: humanizeEnum(priority),
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
        emptyTitle={search ? 'No matching requests' : 'No maintenance requests yet'}
        emptyDescription={
          search
            ? 'Try a different keyword or clear the filters.'
            : isStudent
              ? 'Report an issue and it will appear here as soon as it is submitted.'
              : 'Requests submitted by campus users will appear here.'
        }
        emptyAction={
          isStudent ? (
            <Button asChild size="sm">
              <Link to="/maintenance/requests/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New request
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
