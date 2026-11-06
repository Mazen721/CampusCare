import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import {
  RequestDescriptionCard,
  RequestMetaCard,
  RequestReviewCard,
  RequestWorkOrderCard,
} from '@/features/maintenance/requests/RequestDetailSections';
import { RequestTimeline } from '@/features/maintenance/requests/RequestTimeline';
import { ReviewRequestDialog } from '@/features/maintenance/requests/ReviewRequestDialog';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ApiError } from '@/lib/api';
import type { RequestStatus } from '@/types/meta';

const REVIEWABLE: RequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

function backTarget(role: string | undefined): { to: string; label: string } {
  if (role === 'MAINTENANCE_MANAGER') {
    return { to: '/maintenance/request-queue', label: 'Back to request queue' };
  }
  if (role === 'SUPER_ADMIN') {
    return { to: '/maintenance/requests', label: 'Back to maintenance requests' };
  }
  if (role === 'TECHNICIAN') {
    return { to: '/dashboard', label: 'Back to dashboard' };
  }
  return { to: '/maintenance/requests', label: 'Back to my requests' };
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['request', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('Request id is missing');
      return requestsApi.get(id);
    },
  });

  const back = backTarget(user?.role);
  const request = requestQuery.data?.request;
  const canReview =
    user?.role === 'MAINTENANCE_MANAGER' && request ? REVIEWABLE.includes(request.status) : false;

  const backLink = (
    <Link
      to={back.to}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {back.label}
    </Link>
  );

  if (requestQuery.isLoading) {
    return (
      <div className="space-y-6">
        {backLink}
        <LoadingState label="Loading request…" />
      </div>
    );
  }

  if (requestQuery.isError || !request) {
    const isNotFound = requestQuery.error instanceof ApiError && requestQuery.error.status === 404;
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState
          title={isNotFound ? 'Request not found' : 'Unable to load this request'}
          message={
            requestQuery.error instanceof ApiError
              ? requestQuery.error.message
              : 'Check your connection and try again.'
          }
          onRetry={isNotFound ? undefined : () => void requestQuery.refetch()}
        />
      </div>
    );
  }

  const locationLabel = request.location
    ? `${request.location.buildingName} · ${request.location.floor} · Room ${request.location.room}`
    : 'Location not recorded';

  return (
    <div className="space-y-6">
      {backLink}

      <PageHeader
        eyebrow={request.requestNumber}
        title={request.title}
        description={`${request.category} · ${locationLabel}`}
        actions={
          <>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            {canReview ? (
              <Button onClick={() => setReviewOpen(true)}>
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Review request
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <RequestDescriptionCard request={request} />
          <RequestReviewCard request={request} />
          <RequestWorkOrderCard request={request} />
        </div>

        <div className="space-y-6">
          <RequestTimeline status={request.status} />
          <RequestMetaCard request={request} />
        </div>
      </div>

      <ReviewRequestDialog
        request={request}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}
