import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter {
  id: string;
  label: string;
  value: string;
  options: DataTableFilterOption[];
  onChange: (value: string) => void;
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  error,
  onRetry,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  page,
  limit,
  total,
  onPageChange,
  toolbar,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Items will appear here once they are available.',
  emptyIcon,
  emptyAction,
  className,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const hasFilters = Boolean(onSearchChange) || filters.length > 0 || Boolean(toolbar);

  if (error) {
    return (
      <ErrorState
        title="Unable to load this list"
        message={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card shadow-panel', className)}>
      {hasFilters ? (
        <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {onSearchChange ? (
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <label htmlFor="data-table-search" className="sr-only">
                  Search
                </label>
                <input
                  id="data-table-search"
                  type="search"
                  value={searchValue ?? ''}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </div>
            ) : null}

            {filters.map((filter) => (
              <div key={filter.id} className="w-full sm:w-auto">
                <label htmlFor={`filter-${filter.id}`} className="sr-only">
                  {filter.label}
                </label>
                <select
                  id={`filter-${filter.id}`}
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading table">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.headerClassName}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{rangeStart}</span>–
              <span className="font-medium text-foreground">{rangeEnd}</span> of{' '}
              <span className="font-medium text-foreground">{total}</span>
            </p>
            <nav className="flex items-center gap-2" aria-label="Table pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
              </Button>
              <span className="px-1 text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
