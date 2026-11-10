import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface LedgerEmptyAction {
  label: string;
  to: string;
}

export interface PortalLedgerCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  headerAction?: ReactNode;
  subHeader?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  onRetry?: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: LucideIcon;
  emptyAction?: LedgerEmptyAction;
  children: ReactNode;
}

/**
 * Single-elevation MNU portal ledger card supporting loading, error, and empty states.
 */
export function PortalLedgerCard({
  title,
  description,
  icon: HeaderIcon,
  headerAction,
  subHeader,
  isLoading = false,
  loadingLabel,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  children,
}: PortalLedgerCardProps) {
  return (
    <Card className="flex min-w-0 flex-col rounded-xl border-border bg-card shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold leading-snug tracking-[-0.01em] text-foreground">
            {HeaderIcon ? (
              <HeaderIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            ) : null}
            <span className="sm:truncate">{title}</span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-1">
        {subHeader}
        {isLoading ? (
          <LoadingState
            label={loadingLabel}
            className="min-h-[168px] flex-1 border-0 bg-transparent px-4 py-6"
          />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={onRetry}
            className="min-h-[168px] flex-1 border-0 bg-transparent px-4 py-6"
          />
        ) : isEmpty ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            className="min-h-[168px] flex-1 border-0 bg-transparent px-4 py-6"
            action={
              emptyAction ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={emptyAction.to}>{emptyAction.label}</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
