import { ClipboardCheck, Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ReviewRequestDialog } from '@/features/maintenance/requests/ReviewRequestDialog';
import { ApiError } from '@/lib/api';
import { humanizeEnum } from '@/lib/labels';
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
      header: 'Request',
      cell: (request) => (
        <div className="min-w-0">
          <Link
            to={`/maintenance/requests/${request.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {request.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{request.requestNumber}</p>
        </div>
      ),
    },
    {
      id: 'requester',
      header: 'Requester',
      cell: (request) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{request.requester?.name ?? '—'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {request.requester?.department || request.requester?.email || ''}
          </p>
        </div>
      ),
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
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/maintenance/requests/${request.id}`}>View</Link>
          </Button>
          {REVIEWABLE.includes(request.status) ? (
            <Button size="sm" onClick={() => setSelected(request)}>
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Review
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const errorMessage =
    requestsQuery.error instanceof ApiError
      ? requestsQuery.error.message
      : requestsQuery.error
        ? 'Unable to load the request queue right now.'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        title="Request queue"
        description="Triage incoming requests. Critical and high priority items are listed first, followed by the newest submissions."
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
        emptyIcon={Inbox}
        emptyTitle={search || statusFilter !== 'ALL' ? 'No matching requests' : 'The queue is clear'}
        emptyDescription={
          search || statusFilter !== 'ALL'
            ? 'Try a different keyword or clear the filters.'
            : 'New maintenance requests will appear here as soon as users submit them.'
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
