import { PackagePlus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { ItemCard } from '@/features/lost-found/items/ItemCard';
import { ItemPagination } from '@/features/lost-found/items/ItemPagination';
import {
  EMPTY_ITEM_FILTERS,
  ItemFilters,
  type ItemFilterState,
} from '@/features/lost-found/items/ItemFilters';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const PAGE_SIZE = 12;

export function BrowseItemsPage() {
  const [filters, setFilters] = useState<ItemFilterState>({ ...EMPTY_ITEM_FILTERS });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.q);

  const itemsQuery = useQuery({
    queryKey: ['lost-found-items', 'browse', { ...filters, q: debouncedSearch, page }],
    queryFn: () =>
      itemsApi.list({
        q: debouncedSearch || undefined,
        reportType: filters.reportType === 'ALL' ? undefined : filters.reportType,
        category: filters.category === 'ALL' ? undefined : filters.category,
        building: filters.building || undefined,
        color: filters.color || undefined,
        brand: filters.brand || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        scope: 'active',
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const updateFilters = (patch: Partial<ItemFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_ITEM_FILTERS });
    setPage(1);
  };

  const items = itemsQuery.data?.data ?? [];
  const total = itemsQuery.data?.total ?? 0;
  const hasActiveFilters =
    filters.q !== '' ||
    filters.reportType !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.building !== '' ||
    filters.color !== '' ||
    filters.brand !== '' ||
    filters.status !== 'ALL' ||
    filters.from !== '' ||
    filters.to !== '';

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
        title="Browse lost & found"
        description="Search public reports across campus. Private identifying details and reporter contact information are never shown here."
        actions={
          <Button asChild>
            <Link to="/lost-found/report">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Report an item
            </Link>
          </Button>
        }
      />

      <ItemFilters values={filters} onChange={updateFilters} onReset={resetFilters} />

      {itemsQuery.isLoading ? (
        <LoadingState label="Loading lost and found reports…" />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load lost and found reports"
          message={errorMessage}
          onRetry={() => void itemsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasActiveFilters ? 'No reports match those filters' : 'No reports yet'}
          description={
            hasActiveFilters
              ? 'Try a broader search or reset the filters to see every report.'
              : 'When someone reports a lost or found item, it will appear here.'
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/lost-found/report">Report an item</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span>{' '}
              {total === 1 ? 'report' : 'reports'}
            </p>
            <p className="text-xs text-muted-foreground">Page {page}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          <ItemPagination
            page={page}
            limit={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
