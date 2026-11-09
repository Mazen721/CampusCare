import { PackagePlus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getErrorMessage } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const PAGE_SIZE = 12;

export function BrowseItemsPage() {
  const { t } = useTranslation();
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

  const errorMessage = itemsQuery.error ? getErrorMessage(itemsQuery.error) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('lostFound.title')}
        title={t('lostFound.browseTitle')}
        description={t('lostFound.browseSubtitle')}
        actions={
          <Button asChild>
            <Link to="/lost-found/report">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              {t('lostFound.reportAnItem')}
            </Link>
          </Button>
        }
      />

      <ItemFilters values={filters} onChange={updateFilters} onReset={resetFilters} />

      {itemsQuery.isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : errorMessage ? (
        <ErrorState
          title={t('errors.generic')}
          message={errorMessage}
          onRetry={() => void itemsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasActiveFilters ? t('lostFound.noReportsMatch') : t('lostFound.noReportsYet')}
          description={
            hasActiveFilters
              ? t('lostFound.tryBroaderSearch')
              : t('lostFound.whenReportedAppear')
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                {t('common.clearFilters')}
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/lost-found/report">{t('lostFound.reportAnItem')}</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span>{' '}
              {t('lostFound.count', { count: total })}
            </p>
            <p className="text-xs text-muted-foreground">{t('lostFound.page', { page })}</p>
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
