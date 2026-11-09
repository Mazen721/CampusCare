import {
  CalendarDays,
  ClipboardCheck,
  MapPin,
  MessageSquare,
  RotateCcw,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { formatLocation, tr } from '@/i18n/localize';
import { RequestAttachments } from '@/features/maintenance/requests/RequestAttachments';
import type { MaintenanceRequestRecord } from '@/types/maintenance';

interface SectionProps {
  request: MaintenanceRequestRecord;
}

export function RequestDescriptionCard({ request }: SectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t('requests.issueDetails')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="whitespace-pre-line text-sm leading-7 text-foreground">
          {tr(request, 'description')}
        </p>

        {request.equipmentDescription ? (
          <div className="rounded-md border bg-muted/30 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('requests.equipmentInvolved')}
            </p>
            <p className="mt-1 text-sm text-foreground">{request.equipmentDescription}</p>
          </div>
        ) : null}

        <RequestAttachments attachments={request.attachments} title={tr(request, 'title')} />
      </CardContent>
    </Card>
  );
}

export function RequestReviewCard({ request }: SectionProps) {
  const { t } = useTranslation();
  const hasReview = Boolean(request.reviewedBy || request.reviewNotes || request.reviewedAt);

  if (!hasReview) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{t('requests.awaitingReview')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t('requests.awaitingReviewDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t('requests.review')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t('requests.reviewedBy')}</span>
          <span className="text-end font-medium text-foreground">
            {request.reviewedBy?.name ? <bdi>{request.reviewedBy.name}</bdi> : t('requests.managerRole')}
          </span>
        </div>
        {request.reviewedAt ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t('requests.reviewedAt')}</span>
            <span className="text-end text-foreground">
              {formatDate(request.reviewedAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        ) : null}
        {request.reviewNotes ? (
          <div className="rounded-md border bg-muted/30 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.notes')}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {request.reviewNotes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RequestWorkOrderCard({ request }: SectionProps) {
  const { t } = useTranslation();
  const workOrder = request.currentWorkOrder;

  if (!workOrder) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('requests.assignedWorkOrder')}
        </CardTitle>
        <StatusBadge status={workOrder.status} />
      </CardHeader>
      <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('workOrders.workOrderNumber')}
          </p>
          <p className="mt-1 text-sm font-medium">
            <Link
              to={`/work-orders/${workOrder.id}`}
              className="font-mono text-primary hover:underline"
            >
              <span dir="ltr">{workOrder.workOrderNumber}</span>
            </Link>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('workOrders.sourceType')}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {enumLabel('sourceType', workOrder.sourceType ?? 'REACTIVE')}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('workOrders.assignedTechnician')}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {workOrder.assignedTechnician?.name ? (
              <bdi>{workOrder.assignedTechnician.name}</bdi>
            ) : (
              t('requests.notAssignedYet')
            )}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('workOrders.scheduledStart')}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {workOrder.scheduledStart
              ? formatDate(workOrder.scheduledStart, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : t('requests.notScheduled')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestMetaCard({ request }: SectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t('requests.issueDetails')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground">{t('common.category')}</span>
          <span className="text-end font-medium text-foreground">
            {enumLabel('maintenanceCategory', request.category)}
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('common.location')}
            </p>
            {request.location ? (
              <p className="mt-0.5 text-foreground">
                {formatLocation(request.location)}
              </p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">{t('requests.notRecorded')}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('requests.requester')}
            </p>
            <p className="mt-0.5 text-foreground">
              {request.requester?.name ? <bdi>{request.requester.name}</bdi> : '—'}
            </p>
            {tr(request.requester, 'department') ? (
              <p className="text-xs text-muted-foreground">{tr(request.requester, 'department')}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3.5 border-t pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">{t('requests.submittedOn')}</span>
            <span className="text-end text-xs text-foreground">
              {formatDate(request.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">{t('requests.lastUpdated')}</span>
            <span className="text-end text-xs text-foreground">
              {formatDate(request.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          {request.reopenCount > 0 ? (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('requests.stepReopened')}
              </span>
              <span className="text-end font-medium text-foreground">
                {t('requests.reopenedTimes', { count: request.reopenCount })}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
