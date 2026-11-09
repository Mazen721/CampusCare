import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClaimsTable } from '@/features/lost-found/claims/ClaimsTable';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import type { ClaimStatus } from '@/types/claims';

const PAGE_SIZE = 10;

export function ClaimsQueuePage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'ALL' | ClaimStatus>('ALL');
  const [page, setPage] = useState(1);

  const claimsQuery = useQuery({
    queryKey: ['lost-found-claims', 'queue', status, page],
    queryFn: () =>
      claimsApi.list({
        status: status === 'ALL' ? undefined : status,
        page,
        limit: PAGE_SIZE,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('lostFound.title')}
        title={t('claims.queueTitle')}
        description={t('claims.queueDescription')}
      />

      <ClaimsTable
        mode="queue"
        data={claimsQuery.data?.data ?? []}
        isLoading={claimsQuery.isLoading}
        error={
          claimsQuery.isError
            ? t('errors.network')
            : null
        }
        onRetry={() => void claimsQuery.refetch()}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        page={page}
        limit={PAGE_SIZE}
        total={claimsQuery.data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
