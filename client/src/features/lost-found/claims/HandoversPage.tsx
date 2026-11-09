import { Eye, Handshake } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { HandoverDialog } from '@/features/lost-found/claims/HandoverDialog';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { humanizeEnum } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { CLAIM_STATUSES, type ClaimRecord, type ClaimStatus } from '@/types/claims';

const PAGE_SIZE = 10;

export function HandoversPage() {
  const [status, setStatus] = useState<'ALL' | ClaimStatus>('APPROVED');
  const [page, setPage] = useState(1);
  const [handoverClaim, setHandoverClaim] = useState<ClaimRecord | null>(null);

  const claimsQuery = useQuery({
    queryKey: ['lost-found-claims', 'handovers', status, page],
    queryFn: () =>
      claimsApi.list({
        status: status === 'ALL' ? undefined : status,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const columns: Array<DataTableColumn<ClaimRecord>> = [
    {
      id: 'claim',
      header: 'Claim',
      cell: (claim) => (
        <div className="min-w-0">
          <Link
            to={`/lost-found/claims/${claim.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            <span dir="ltr">{claim.claimNumber}</span>
          </Link>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Updated {formatDate(claim.updatedAt)}
          </p>
        </div>
      ),
    },
    {
      id: 'item',
      header: 'Found item',
      cell: (claim) => (
        <div className="min-w-0">
          <p className="max-w-[240px] truncate text-sm font-medium text-foreground">
            {claim.item?.itemTitle ?? 'Unavailable'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {claim.item?.reportNumber ? <span dir="ltr">{claim.item.reportNumber}</span> : null}
          </p>
        </div>
      ),
    },
    {
      id: 'claimant',
      header: 'Claimant',
      cell: (claim) => (
        <div className="min-w-0 text-xs">
          <p className="font-medium text-foreground">
            <bdi>{claim.claimant?.name ?? 'Unknown'}</bdi>
          </p>
          <p className="text-muted-foreground">
            {claim.claimant?.email ? <span dir="ltr">{claim.claimant.email}</span> : null}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (claim) => <StatusBadge status={claim.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (claim) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/lost-found/claims/${claim.id}`}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </Link>
          </Button>
          {claim.status === 'APPROVED' ? (
            <Button size="sm" onClick={() => setHandoverClaim(claim)}>
              <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
              Handover
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lost & Found"
        title="Handovers"
        description="Approved claims waiting for the item to be physically collected. Recording a handover closes the claim and returns both linked reports."
      />

      <DataTable
        columns={columns}
        data={claimsQuery.data?.data ?? []}
        rowKey={(claim) => claim.id}
        isLoading={claimsQuery.isLoading}
        error={
          claimsQuery.isError
            ? 'Unable to load handovers. Check your connection and try again.'
            : null
        }
        onRetry={() => void claimsQuery.refetch()}
        filters={[
          {
            id: 'handover-status',
            label: 'Status',
            value: status,
            options: [
              { label: 'All statuses', value: 'ALL' },
              ...CLAIM_STATUSES.map((value) => ({
                label: humanizeEnum(value),
                value,
              })),
            ],
            onChange: (value) => {
              setStatus(value as 'ALL' | ClaimStatus);
              setPage(1);
            },
          },
        ]}
        page={page}
        limit={PAGE_SIZE}
        total={claimsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={Handshake}
        emptyTitle="No handovers waiting"
        emptyDescription="Claims appear here after an officer approves them for handover."
      />

      {handoverClaim ? (
        <HandoverDialog
          claim={handoverClaim}
          open
          onOpenChange={(open) => {
            if (!open) setHandoverClaim(null);
          }}
        />
      ) : null}
    </div>
  );
}
