import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  EyeOff,
  Handshake,
  Link2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ClaimReviewDialog } from '@/features/lost-found/claims/ClaimReviewDialog';
import { HandoverDialog } from '@/features/lost-found/claims/HandoverDialog';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ItemGallery } from '@/features/lost-found/items/ItemGallery';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ClaimReviewAction } from '@/types/claims';

function BackToClaims() {
  return (
    <Link
      to="/lost-found/claims"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to claims
    </Link>
  );
}

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isOfficer = user?.role === 'LOST_FOUND_OFFICER';
  const [reviewAction, setReviewAction] = useState<ClaimReviewAction | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);

  const claimQuery = useQuery({
    queryKey: ['lost-found-claim', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('Missing claim id');
      return claimsApi.get(id);
    },
  });

  const claim = claimQuery.data?.claim;

  if (claimQuery.isLoading) {
    return (
      <div className="space-y-6">
        <BackToClaims />
        <LoadingState label="Loading claim details…" />
      </div>
    );
  }

  if (claimQuery.isError || !claim) {
    const notFound = claimQuery.error instanceof ApiError && claimQuery.error.status === 404;
    return (
      <div className="space-y-6">
        <BackToClaims />
        <ErrorState
          title={notFound ? 'Claim not found' : 'Unable to load this claim'}
          message={
            claimQuery.error instanceof ApiError
              ? claimQuery.error.message
              : 'Check your connection and try again.'
          }
          onRetry={notFound ? undefined : () => void claimQuery.refetch()}
        />
      </div>
    );
  }

  const officerActions =
    isOfficer && claim.status === 'PENDING_REVIEW' ? (
      <Button variant="outline" onClick={() => setReviewAction('START_VERIFICATION')}>
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        Start verification
      </Button>
    ) : isOfficer && claim.status === 'UNDER_VERIFICATION' ? (
      <>
        <Button variant="outline" onClick={() => setReviewAction('REJECT')}>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Reject
        </Button>
        <Button onClick={() => setReviewAction('APPROVE')}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Approve
        </Button>
      </>
    ) : isOfficer && claim.status === 'APPROVED' ? (
      <Button onClick={() => setHandoverOpen(true)}>
        <Handshake className="h-4 w-4" aria-hidden="true" />
        Record handover
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <BackToClaims />

      <PageHeader
        eyebrow={claim.claimNumber}
        title={claim.item?.itemTitle ?? 'Claim request'}
        description={`Submitted ${formatDate(claim.createdAt, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}${claim.claimant ? ` by ${claim.claimant.name}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.status} />
            {officerActions}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                Claimant response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Why this is their item
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {claim.claimDescription}
                </p>
              </div>
              <div className="rounded-lg border border-amber-300/70 bg-amber-50/60 p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Identifying details provided
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {claim.identifyingDetailsProvided}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Supporting photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ItemGallery
                images={claim.supportingEvidence}
                itemTitle={`${claim.claimNumber} evidence`}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {claim.item ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Found item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5 text-sm">
                <div>
                  <Link
                    to={`/lost-found/items/${claim.item.id}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                  >
                    {claim.item.reportNumber}
                  </Link>
                  <p className="mt-1 font-semibold text-foreground">{claim.item.itemTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {claim.item.category} · {claim.item.reportType}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={claim.item.status} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Occurred {formatDate(claim.item.occurrenceDate, { dateStyle: 'long' })}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {claim.item.location
                    ? `${claim.item.location.buildingName} · ${claim.item.location.floor} · Room ${claim.item.location.room}`
                    : claim.item.locationDetails}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {isOfficer && claim.item?.privateIdentificationDetails ? (
            <Card className="border-amber-300/70 bg-amber-50/60">
              <CardHeader className="border-b border-amber-200/70">
                <CardTitle className="flex items-center gap-2 text-base">
                  <EyeOff className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Private identification details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {claim.item.privateIdentificationDetails}
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Compare these details with the claimant’s answer before approving.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {claim.linkedLostItem ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Linked lost report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-5 text-sm">
                <Link
                  to={`/lost-found/items/${claim.linkedLostItem.id}`}
                  className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                  {claim.linkedLostItem.reportNumber}
                </Link>
                <p className="font-medium text-foreground">{claim.linkedLostItem.itemTitle}</p>
                <StatusBadge status={claim.linkedLostItem.status} />
              </CardContent>
            </Card>
          ) : null}

          {claim.claimant ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  Claimant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-5 text-sm">
                <p className="font-semibold text-foreground">{claim.claimant.name}</p>
                {claim.claimant.email ? (
                  <p className="text-xs text-muted-foreground">{claim.claimant.email}</p>
                ) : null}
                {claim.claimant.department ? (
                  <p className="text-xs text-muted-foreground">{claim.claimant.department}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {claim.reviewedBy || claim.rejectionReason || claim.verificationNotes ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Review outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5 text-sm">
                {claim.reviewedBy ? (
                  <p className="text-xs text-muted-foreground">
                    Reviewed by <span className="font-medium text-foreground">{claim.reviewedBy.name}</span>
                    {claim.reviewedAt
                      ? ` on ${formatDate(claim.reviewedAt, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`
                      : ''}
                  </p>
                ) : null}
                {claim.rejectionReason ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-900">
                    <p className="font-semibold">Rejection reason</p>
                    <p className="mt-1">{claim.rejectionReason}</p>
                  </div>
                ) : null}
                {claim.verificationNotes ? (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground">Internal notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{claim.verificationNotes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {claim.handover ? (
            <Card className="border-emerald-300/70 bg-emerald-50/50">
              <CardHeader className="border-b border-emerald-200/70">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Handshake className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  Handover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-5 text-sm">
                <p className="font-semibold text-emerald-950">
                  Received by {claim.handover.receivedByName ?? 'the claimant'}
                </p>
                {claim.handover.handedOverAt ? (
                  <p className="text-xs text-emerald-800">
                    {formatDate(claim.handover.handedOverAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                ) : null}
                {claim.handover.handedOverBy ? (
                  <p className="text-xs text-emerald-800">
                    Handed over by {claim.handover.handedOverBy.name}
                  </p>
                ) : null}
                {claim.handover.notes ? (
                  <p className="pt-1 text-xs leading-relaxed text-emerald-900">
                    {claim.handover.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <ClaimReviewDialog
        claim={claim}
        action={reviewAction}
        onOpenChange={(open) => {
          if (!open) setReviewAction(null);
        }}
      />
      <HandoverDialog
        claim={claim}
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
      />
    </div>
  );
}
