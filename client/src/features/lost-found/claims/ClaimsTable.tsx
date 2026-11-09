import { BadgeCheck, Eye, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { CLAIM_STATUSES, type ClaimRecord, type ClaimStatus } from '@/types/claims';

interface ClaimsTableProps {
  data: ClaimRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  status: 'ALL' | ClaimStatus;
  onStatusChange: (value: 'ALL' | ClaimStatus) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  mode: 'mine' | 'queue';
}

export function ClaimsTable({
  data,
  isLoading,
  error,
  onRetry,
  status,
  onStatusChange,
  page,
  limit,
  total,
  onPageChange,
  mode,
}: ClaimsTableProps) {
  const { t } = useTranslation();

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
            {formatDate(claim.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: 'item',
      header: t('claims.claimItem'),
      cell: (claim) =>
        claim.item ? (
          <div className="min-w-0">
            <p className="max-w-[240px] truncate text-sm font-medium text-foreground">
              {claim.item.itemTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              <span dir="ltr">{claim.item.reportNumber}</span> · {enumLabel('lostFoundCategory', claim.item.category)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
        ),
    },
    ...(mode === 'queue'
      ? [
          {
            id: 'claimant',
            header: t('claims.claimant'),
            cell: (claim: ClaimRecord) => (
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
        ]
      : []),
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
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/lost-found/claims/${claim.id}`}>
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
      rowKey={(claim) => claim.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      filters={[
        {
          id: 'claim-status',
          label: t('common.status'),
          value: status,
          options: [
            { label: t('common.all'), value: 'ALL' },
            ...CLAIM_STATUSES.map((value) => ({
              label: enumLabel('status', value),
              value,
            })),
          ],
          onChange: (value) => onStatusChange(value as 'ALL' | ClaimStatus),
        },
      ]}
      page={page}
      limit={limit}
      total={total}
      onPageChange={onPageChange}
      emptyIcon={mode === 'queue' ? ShieldCheck : BadgeCheck}
      emptyTitle={t('claims.noClaimsFound')}
      emptyDescription={t('claims.noClaimsFound')}
    />
  );
}
