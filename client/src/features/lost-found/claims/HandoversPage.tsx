import { Eye, Handshake } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { HandoverDialog } from '@/features/lost-found/claims/HandoverDialog';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { CLAIM_STATUSES, type ClaimRecord, type ClaimStatus } from '@/types/claims';

const PAGE_SIZE = 10;

export function HandoversPage() {
  const { t } = useTranslation();
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
      header: t('claims.claimNumber'),
      cell: (claim) => (
        <div className="min-w-0">
          <Link
            to={`/lost-found/claims/${claim.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            <span dir="ltr">{claim.claimNumber}</span>
          </Link>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(claim.updatedAt)}
          </p>
        </div>
      ),
    },
    {
      id: 'item',
      header: t('claims.claimItem'),
      cell: (claim) => (
        <div className="min-w-0">
          <p className="max-w-[240px] truncate text-sm font-medium text-foreground">
            {claim.item?.itemTitle ?? t('common.none')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {claim.item?.reportNumber ? <span dir="ltr">{claim.item.reportNumber}</span> : null}
          </p>
        </div>
      ),
    },
    {
      id: 'claimant',
      header: t('claims.claimant'),
      cell: (claim) => (
        <div className="min-w-0 text-xs">
          <p className="font-medium text-foreground">
            <bdi>{claim.claimant?.name ?? t('common.none')}</bdi>
          </p>
          <p className="text-muted-foreground">
            {claim.claimant?.email ? <span dir="ltr">{claim.claimant.email}</span> : null}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (claim) => <StatusBadge status={claim.status} />,
    },
    {
      id: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      className: 'text-end',
      cell: (claim) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/lost-found/claims/${claim.id}`}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.details')}
            </Link>
          </Button>
          {claim.status === 'APPROVED' ? (
            <Button size="sm" onClick={() => setHandoverClaim(claim)}>
              <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
              {t('claims.handoverItem')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.lostFound')}
        title={t('nav.handovers')}
        description={t('claims.subtitle')}
      />

      <DataTable
        columns={columns}
        data={claimsQuery.data?.data ?? []}
        rowKey={(claim) => claim.id}
        isLoading={claimsQuery.isLoading}
        error={
          claimsQuery.isError
            ? t('errors.network')
            : null
        }
        onRetry={() => void claimsQuery.refetch()}
        filters={[
          {
            id: 'handover-status',
            label: t('common.status'),
            value: status,
            options: [
              { label: t('common.all'), value: 'ALL' },
              ...CLAIM_STATUSES.map((value) => ({
                label: enumLabel('status', value),
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
        emptyTitle={t('claims.noClaimsFound')}
        emptyDescription={t('claims.noClaimsFound')}
      />

      {handoverClaim ? (
        <HandoverDialog
          claim={handoverClaim}
          open={Boolean(handoverClaim)}
          onOpenChange={(open) => {
            if (!open) setHandoverClaim(null);
          }}
        />
      ) : null}
    </div>
  );
}
