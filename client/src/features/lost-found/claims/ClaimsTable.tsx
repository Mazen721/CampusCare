import { BadgeCheck, Eye, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { humanizeEnum } from '@/lib/labels';
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
            {claim.claimNumber}
          </Link>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Submitted {formatDate(claim.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: 'item',
      header: 'Found item',
      cell: (claim) =>
        claim.item ? (
          <div className="min-w-0">
            <p className="max-w-[240px] truncate text-sm font-medium text-foreground">
              {claim.item.itemTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {claim.item.reportNumber} · {claim.item.category}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        ),
    },
    ...(mode === 'queue'
      ? [
          {
            id: 'claimant',
            header: 'Claimant',
            cell: (claim: ClaimRecord) => (
              <div className="min-w-0 text-xs">
                <p className="font-medium text-foreground">
                  {claim.claimant?.name ?? 'Unknown'}
                </p>
                <p className="text-muted-foreground">{claim.claimant?.email}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'status',
      header: 'Status',
      cell: (claim) => <StatusBadge status={claim.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (claim) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/lost-found/claims/${claim.id}`}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
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
          label: 'Status',
          value: status,
          options: [
            { label: 'All statuses', value: 'ALL' },
            ...CLAIM_STATUSES.map((value) => ({
              label: humanizeEnum(value),
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
      emptyTitle={mode === 'queue' ? 'No claims in the queue' : 'No claims yet'}
      emptyDescription={
        mode === 'queue'
          ? 'Claims submitted by students and employees will appear here for verification.'
          : 'Open a found report and submit a claim if you recognise your item.'
      }
    />
  );
}
