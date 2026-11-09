import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { FeedbackCard } from '@/features/maintenance/feedback/FeedbackCard';
import { ReopenRequestDialog } from '@/features/maintenance/requests/ReopenRequestDialog';
import {
  RequestDescriptionCard,
  RequestMetaCard,
  RequestReviewCard,
  RequestWorkOrderCard,
} from '@/features/maintenance/requests/RequestDetailSections';
import { RequestTimeline } from '@/features/maintenance/requests/RequestTimeline';
import { ReviewRequestDialog } from '@/features/maintenance/requests/ReviewRequestDialog';
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ApiError, getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import type { RequestStatus } from '@/types/meta';

const REVIEWABLE: RequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

function backTarget(role: string | undefined): { to: string; labelKey: string } {
  if (role === 'MAINTENANCE_MANAGER') {
    return { to: '/maintenance/request-queue', labelKey: 'requests.backToQueue' };
  }
  if (role === 'SUPER_ADMIN') {
    return { to: '/maintenance/requests', labelKey: 'requests.backToRequests' };
  }
  if (role === 'TECHNICIAN') {
    return { to: '/work-orders', labelKey: 'requests.backToWorkOrders' };
  }
  return { to: '/maintenance/requests', labelKey: 'requests.backToMyRequests' };
}

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['request', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('Request id is missing');
      return requestsApi.get(id);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Missing request id');
      return requestsApi.confirm(id);
    },
    onSuccess: async () => {
      setConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['request', id] });
      await queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('requests.requestClosedSuccess'));
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const back = backTarget(user?.role);
  const request = requestQuery.data?.request;

  const isOwner = Boolean(user && request?.requester && user.id === request.requester.id);
  const isManager = user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';

  const canReview = isManager && request ? REVIEWABLE.includes(request.status) : false;
  const canConfirm = (isOwner || isManager) && request?.status === 'COMPLETED';
  const canReopen = (isOwner || isManager) && request?.status === 'COMPLETED';
  const canCloseReopened = isManager && request?.status === 'REOPENED';

  const backLink = (
    <Link
      to={back.to}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      {t(back.labelKey)}
    </Link>
  );

  if (requestQuery.isLoading) {
    return (
      <div className="space-y-6">
        {backLink}
        <LoadingState label={t('common.loading')} />
      </div>
    );
  }

  if (requestQuery.isError || !request) {
    const isNotFound = requestQuery.error instanceof ApiError && requestQuery.error.status === 404;
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState
          title={isNotFound ? t('errors.network') : t('errors.network')}
          message={getErrorMessage(requestQuery.error)}
          onRetry={isNotFound ? undefined : () => void requestQuery.refetch()}
        />
      </div>
    );
  }

  const locationLabel = request.location
    ? `${request.location.buildingName} · ${request.location.floor} · ${request.location.room}`
    : t('requests.notRecorded');

  return (
    <div className="space-y-6">
      {backLink}

      <PageHeader
        eyebrow={request.requestNumber}
        title={request.title}
        description={`${enumLabel('maintenanceCategory', request.category)} · ${locationLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />

            {canReview && (
              <Button onClick={() => setReviewOpen(true)}>
                <ClipboardCheck className="me-1.5 h-4 w-4" aria-hidden="true" />
                {t('requests.reviewRequest')}
              </Button>
            )}

            {canConfirm && (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={confirmMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="me-1.5 h-4 w-4" />
                )}
                {t('requests.confirmResolution')}
              </Button>
            )}

            {canReopen && (
              <Button
                variant="outline"
                onClick={() => setReopenOpen(true)}
                className="text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
              >
                <RotateCcw className="me-1.5 h-4 w-4" />
                {t('requests.reopenRequest')}
              </Button>
            )}

            {canCloseReopened && (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending && (
                  <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                )}
                {t('requests.closeRequest')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <RequestDescriptionCard request={request} />
          <RequestReviewCard request={request} />
          <RequestWorkOrderCard request={request} />
          {request.status === 'CLOSED' && (
            <FeedbackCard request={request} isOwner={isOwner} />
          )}
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

      <ReopenRequestDialog
        request={request}
        open={reopenOpen}
        onOpenChange={setReopenOpen}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={request.status === 'REOPENED' ? t('requests.confirmCloseTitle') : t('requests.confirmResolutionTitle')}
        description={
          request.status === 'REOPENED'
            ? t('requests.confirmCloseDesc')
            : t('requests.confirmResolutionDesc')
        }
        confirmLabel={request.status === 'REOPENED' ? t('requests.closeRequest') : t('requests.confirmResolution')}
        cancelLabel={t('common.cancel')}
        isLoading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
      />
    </div>
  );
}
