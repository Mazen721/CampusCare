import { ArrowLeft, BadgeCheck, PackageOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClaimForm } from '@/features/lost-found/claims/ClaimForm';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { enumLabel } from '@/lib/labels';
import type { ItemStatus, LostFoundItem } from '@/types/lostFound';

const CLAIMABLE_STATUSES: readonly ItemStatus[] = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
];

const LINKABLE_LOST_STATUSES: readonly ItemStatus[] = ['OPEN', 'MATCH_CONFIRMED'];

function isClaimable(item: LostFoundItem): boolean {
  return item.reportType === 'FOUND' && CLAIMABLE_STATUSES.includes(item.status);
}

export function SubmitClaimPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('itemId') ?? '';
  const linkedLostItemId = searchParams.get('linkedLostItemId') ?? '';

  const itemQuery = useQuery({
    queryKey: ['lost-found-item', itemId],
    enabled: Boolean(itemId),
    queryFn: () => itemsApi.get(itemId),
  });

  const claimableQuery = useQuery({
    queryKey: ['lost-found-claimable-items'],
    enabled: !itemId,
    queryFn: () => itemsApi.list({ reportType: 'FOUND', limit: 100 }),
  });

  const lostQuery = useQuery({
    queryKey: ['lost-found-my-lost-reports'],
    queryFn: () => itemsApi.list({ mine: true, reportType: 'LOST', limit: 100 }),
  });

  const isLoading = itemQuery.isLoading || claimableQuery.isLoading || lostQuery.isLoading;
  const hasError = itemQuery.isError || claimableQuery.isError || lostQuery.isError;

  const selectedItem = itemId ? itemQuery.data?.item ?? null : null;
  const claimableItems = (claimableQuery.data?.data ?? []).filter(isClaimable);
  const lostReports = (lostQuery.data?.data ?? []).filter((item) =>
    LINKABLE_LOST_STATUSES.includes(item.status),
  );

  return (
    <div className="space-y-6">
      <Link
        to="/lost-found"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t('lostFound.backToBrowse')}
      </Link>

      <PageHeader
        eyebrow={t('lostFound.title')}
        title={t('claims.submitTitle')}
        description={t('claims.submitDescription')}
      />

      {isLoading ? <LoadingState label={t('common.loading')} /> : null}

      {!isLoading && hasError ? (
        <ErrorState
          title={t('errors.generic')}
          message={t('errors.network')}
          onRetry={() => {
            void itemQuery.refetch();
            void claimableQuery.refetch();
            void lostQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && !hasError && itemId && !selectedItem ? (
        <ErrorState
          title={t('errors.notFoundTitle')}
          message={t('errors.notFoundDetailDesc')}
        />
      ) : null}

      {!isLoading && !hasError && selectedItem && !isClaimable(selectedItem) ? (
        <ErrorState
          title={t('errors.forbiddenTitle')}
          message={`${t('common.status')}: ${enumLabel('status', selectedItem.status)}`}
        />
      ) : null}

      {!isLoading && !hasError && selectedItem && isClaimable(selectedItem) ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('claims.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <ClaimForm
              key={selectedItem.id}
              claimableItems={[]}
              foundItem={selectedItem}
              lostReports={lostReports}
              defaultLinkedLostItemId={linkedLostItemId}
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !hasError && !itemId && claimableItems.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t('claims.noClaimsFound')}
          description={t('lostFound.noActiveAvailableDesc')}
        />
      ) : null}

      {!isLoading && !hasError && !itemId && claimableItems.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('claims.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <ClaimForm
              claimableItems={claimableItems}
              foundItem={null}
              lostReports={lostReports}
              defaultLinkedLostItemId={linkedLostItemId}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
