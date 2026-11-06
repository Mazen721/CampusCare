import {
  CalendarDays,
  ClipboardCheck,
  MapPin,
  MessageSquare,
  RotateCcw,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { humanizeEnum } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { RequestAttachments } from '@/features/maintenance/requests/RequestAttachments';
import type { MaintenanceRequestRecord } from '@/types/maintenance';

interface SectionProps {
  request: MaintenanceRequestRecord;
}

export function RequestDescriptionCard({ request }: SectionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Issue details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="whitespace-pre-line text-sm leading-7 text-foreground">
          {request.description}
        </p>

        {request.equipmentDescription ? (
          <div className="rounded-md border bg-muted/30 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Equipment involved
            </p>
            <p className="mt-1 text-sm text-foreground">{request.equipmentDescription}</p>
          </div>
        ) : null}

        <RequestAttachments attachments={request.attachments} title={request.title} />
      </CardContent>
    </Card>
  );
}

export function RequestReviewCard({ request }: SectionProps) {
  const hasReview = Boolean(request.reviewedBy || request.reviewNotes || request.reviewedAt);

  if (!hasReview) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Awaiting manager review</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              The maintenance manager will review this request and approve it or reject it with a
              reason. You will receive a notification either way.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Reviewed by</span>
          <span className="text-right font-medium text-foreground">
            {request.reviewedBy?.name ?? 'Maintenance manager'}
          </span>
        </div>
        {request.reviewedAt ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Reviewed at</span>
            <span className="text-right text-foreground">
              {formatDate(request.reviewedAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        ) : null}
        {request.reviewNotes ? (
          <div className="rounded-md border bg-muted/30 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              Notes
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
  const workOrder = request.currentWorkOrder;

  if (!workOrder) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
          Work order
        </CardTitle>
        <StatusBadge status={workOrder.status} />
      </CardHeader>
      <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Work order number
          </p>
          <p className="mt-1 text-sm font-medium">
            <Link
              to={`/work-orders/${workOrder.id}`}
              className="font-mono text-primary hover:underline"
            >
              {workOrder.workOrderNumber}
            </Link>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Source
          </p>
          <p className="mt-1 text-sm text-foreground">
            {workOrder.sourceType ? humanizeEnum(workOrder.sourceType) : 'Reactive'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Technician
          </p>
          <p className="mt-1 text-sm text-foreground">
            {workOrder.assignedTechnician?.name ?? 'Not assigned yet'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Scheduled start
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {workOrder.scheduledStart
              ? formatDate(workOrder.scheduledStart, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Not scheduled'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestMetaCard({ request }: SectionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Request details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground">Category</span>
          <span className="text-right font-medium text-foreground">{request.category}</span>
        </div>

        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </p>
            {request.location ? (
              <p className="mt-0.5 text-foreground">
                {request.location.buildingName}
                <br />
                <span className="text-muted-foreground">
                  {request.location.floor} · Room {request.location.room}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">Not recorded</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Requester
            </p>
            <p className="mt-0.5 text-foreground">{request.requester?.name ?? '—'}</p>
            {request.requester?.department ? (
              <p className="text-xs text-muted-foreground">{request.requester.department}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3.5 border-t pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">Submitted</span>
            <span className="text-right text-xs text-foreground">
              {formatDate(request.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">Last updated</span>
            <span className="text-right text-xs text-foreground">
              {formatDate(request.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          {request.reopenCount > 0 ? (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reopened
              </span>
              <span className="text-right font-medium text-foreground">
                {request.reopenCount} {request.reopenCount === 1 ? 'time' : 'times'}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
