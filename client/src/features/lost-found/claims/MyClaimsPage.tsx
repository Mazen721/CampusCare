import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClaimsTable } from '@/features/lost-found/claims/ClaimsTable';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import type { ClaimStatus } from '@/types/claims';

const PAGE_SIZE = 10;

export function MyClaimsPage() {
  const [status, setStatus] = useState<'ALL' | ClaimStatus>('ALL');
  const [page, setPage] = useState(1);

  const claimsQuery = useQuery({
    queryKey: ['lost-found-claims', 'mine', status, page],
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
        title="My claims"
        description="Track the verification of items you have claimed and see when a handover is ready."
      />

      <ClaimsTable
        mode="mine"
        data={claimsQuery.data?.data ?? []}
        isLoading={claimsQuery.isLoading}
        error={
          claimsQuery.isError
            ? 'Unable to load your claims. Check your connection and try again.'
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
