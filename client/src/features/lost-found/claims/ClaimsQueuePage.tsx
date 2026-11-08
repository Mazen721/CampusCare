import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClaimsTable } from '@/features/lost-found/claims/ClaimsTable';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import type { ClaimStatus } from '@/types/claims';

const PAGE_SIZE = 10;

export function ClaimsQueuePage() {
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
        eyebrow="Lost & Found"
        title="Claims queue"
        description="Compare each claimant's answers with the private identification details before approving a handover."
      />

      <ClaimsTable
        mode="queue"
        data={claimsQuery.data?.data ?? []}
        isLoading={claimsQuery.isLoading}
        error={
          claimsQuery.isError
            ? 'Unable to load the claims queue. Check your connection and try again.'
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
