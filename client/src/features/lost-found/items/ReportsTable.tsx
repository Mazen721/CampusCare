import { Eye, Files } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReportTypeBadge } from '@/features/lost-found/items/ReportTypeBadge';
import { humanizeEnum } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import {
  ITEM_STATUSES,
  REPORT_TYPES,
  type ItemStatus,
  type LostFoundItem,
  type ReportType,
} from '@/types/lostFound';

interface ReportsTableProps {
  data: LostFoundItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  reportType: 'ALL' | ReportType;
  onReportTypeChange: (value: 'ALL' | ReportType) => void;
  status: 'ALL' | ItemStatus;
  onStatusChange: (value: 'ALL' | ItemStatus) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  allowedStatuses?: readonly ItemStatus[];
}

export function ReportsTable({
  data,
  isLoading,
  error,
  onRetry,
  searchValue,
  onSearchChange,
  reportType,
  onReportTypeChange,
  status,
  onStatusChange,
  page,
  limit,
  total,
  onPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  allowedStatuses = ITEM_STATUSES,
}: ReportsTableProps) {
  const columns: Array<DataTableColumn<LostFoundItem>> = [
    {
      id: 'report',
      header: 'Report',
      cell: (item) => (
        <div className="min-w-0">
          <Link
            to={`/lost-found/items/${item.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {item.reportNumber}
          </Link>
          <p className="mt-0.5 max-w-[260px] truncate text-sm font-medium text-foreground">
            {item.itemTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">{item.category}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item) => <ReportTypeBadge reportType={item.reportType} />,
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item) => (
        <div className="max-w-[230px] text-xs text-muted-foreground">
          {item.location ? (
            <>
              <p className="font-medium text-foreground">{item.location.buildingName}</p>
              <p>
                {item.location.floor} · Room {item.location.room}
              </p>
            </>
          ) : (
            <p>{item.locationDetails}</p>
          )}
        </div>
      ),
    },
    {
      id: 'occurred',
      header: 'Occurred',
      cell: (item) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(item.occurrenceDate)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (item) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/lost-found/items/${item.id}`}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(item) => item.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search report number, title or description…"
      filters={[
        {
          id: 'report-type',
          label: 'Report type',
          value: reportType,
          options: [
            { label: 'All types', value: 'ALL' },
            ...REPORT_TYPES.map((type) => ({
              label: humanizeEnum(type),
              value: type,
            })),
          ],
          onChange: (value) => onReportTypeChange(value as 'ALL' | ReportType),
        },
        {
          id: 'item-status',
          label: 'Status',
          value: status,
          options: [
            { label: 'All statuses', value: 'ALL' },
            ...allowedStatuses.map((itemStatus) => ({
              label: humanizeEnum(itemStatus),
              value: itemStatus,
            })),
          ],
          onChange: (value) => onStatusChange(value as 'ALL' | ItemStatus),
        },
      ]}
      page={page}
      limit={limit}
      total={total}
      onPageChange={onPageChange}
      emptyIcon={Files}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    />
  );
}
