import { Eye, Files } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReportTypeBadge } from '@/features/lost-found/items/ReportTypeBadge';
import { formatLocation, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
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
  const { t } = useTranslation();

  const columns: Array<DataTableColumn<LostFoundItem>> = [
    {
      id: 'report',
      header: t('lostFound.reportNumber'),
      cell: (item) => (
        <div className="min-w-0">
          <Link
            to={`/lost-found/items/${item.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            <span dir="ltr">{item.reportNumber}</span>
          </Link>
          <p className="mt-0.5 max-w-[260px] truncate text-sm font-medium text-foreground">
            {tr(item, 'itemTitle')}
          </p>
          <p className="text-[11px] text-muted-foreground">{enumLabel('lostFoundCategory', item.category)}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: t('lostFound.filterByType'),
      cell: (item) => <ReportTypeBadge reportType={item.reportType} />,
    },
    {
      id: 'location',
      header: t('common.location'),
      cell: (item) => (
        <div className="max-w-[230px] text-xs text-muted-foreground">
          {item.location ? (
            <p className="font-medium text-foreground">{formatLocation(item.location)}</p>
          ) : (
            <p>{tr(item, 'locationDetails')}</p>
          )}
        </div>
      ),
    },
    {
      id: 'occurred',
      header: t('common.date'),
      cell: (item) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(item.occurrenceDate)}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (item) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/lost-found/items/${item.id}`}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {t('common.details')}
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
      searchPlaceholder={t('lostFound.searchPlaceholder')}
      filters={[
        {
          id: 'report-type',
          label: t('lostFound.filterByType'),
          value: reportType,
          options: [
            { label: t('lostFound.allTypes'), value: 'ALL' },
            ...REPORT_TYPES.map((type) => ({
              label: enumLabel('reportType', type),
              value: type,
            })),
          ],
          onChange: (value) => onReportTypeChange(value as 'ALL' | ReportType),
        },
        {
          id: 'item-status',
          label: t('common.status'),
          value: status,
          options: [
            { label: t('lostFound.allStatuses'), value: 'ALL' },
            ...allowedStatuses.map((itemStatus) => ({
              label: enumLabel('status', itemStatus),
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
