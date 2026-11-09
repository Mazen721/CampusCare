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
import { useTranslation } from 'react-i18next';
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
import { formatLocation, tr } from '@/i18n/localize';
import { ApiError, getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import type { ClaimReviewAction } from '@/types/claims';

function BackToClaims() {
  const { t } = useTranslation();
  return (
    <Link
      to="/lost-found/claims"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      {t('claims.backToClaims')}
    </Link>
  );
}

export function ClaimDetailPage() {
  const { t } = useTranslation();
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
        <LoadingState label={t('common.loading')} />
      </div>
    );
  }

  if (claimQuery.isError || !claim) {
    const notFound = claimQuery.error instanceof ApiError && claimQuery.error.status === 404;
    return (
      <div className="space-y-6">
        <BackToClaims />
        <ErrorState
          title={notFound ? t('errors.notFoundTitle') : t('errors.generic')}
          message={
            getErrorMessage(claimQuery.error, t('errors.network'))
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
        {t('claims.startVerificationAction')}
      </Button>
    ) : isOfficer && claim.status === 'UNDER_VERIFICATION' ? (
      <>
        <Button variant="outline" onClick={() => setReviewAction('REJECT')}>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          {t('claims.rejectAction')}
        </Button>
        <Button onClick={() => setReviewAction('APPROVE')}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {t('claims.approveAction')}
        </Button>
      </>
    ) : isOfficer && claim.status === 'APPROVED' ? (
      <Button onClick={() => setHandoverOpen(true)}>
        <Handshake className="h-4 w-4" aria-hidden="true" />
        {t('claims.recordHandoverAction')}
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <BackToClaims />

      <PageHeader
        eyebrow={<span dir="ltr">{claim.claimNumber}</span>}
        title={claim.item ? tr(claim.item, 'itemTitle') : t('claims.claimNumber')}
        description={`${formatDate(claim.createdAt, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}${claim.claimant ? ` · ${claim.claimant.name}` : ''}`}
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
                {t('claims.claimantResponse')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('claims.whyTheirItem')}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {tr(claim, 'claimDescription')}
                </p>
              </div>
              <div className="rounded-lg border border-amber-300/70 bg-amber-50/60 p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('claims.identifyingProvided')}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {claim.identifyingDetailsProvided}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>{t('claims.supportingPhotos')}</CardTitle>
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
                  {t('claims.foundItemDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5 text-sm">
                <div>
                  <Link
                    to={`/lost-found/items/${claim.item.id}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                  >
                    <span dir="ltr">{claim.item.reportNumber}</span>
                  </Link>
                  <p className="mt-1 font-semibold text-foreground">{tr(claim.item, 'itemTitle')}</p>
                  <p className="text-xs text-muted-foreground">
                    {enumLabel('lostFoundCategory', claim.item.category)} · {enumLabel('reportType', claim.item.reportType)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={claim.item.status} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {formatDate(claim.item.occurrenceDate, { dateStyle: 'long' })}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {claim.item.location
                    ? formatLocation(claim.item.location)
                    : tr(claim.item, 'locationDetails')}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {isOfficer && claim.item?.privateIdentificationDetails ? (
            <Card className="border-amber-300/70 bg-amber-50/60">
              <CardHeader className="border-b border-amber-200/70">
                <CardTitle className="flex items-center gap-2 text-base">
                  <EyeOff className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  {t('lostFound.privateDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {claim.item.privateIdentificationDetails}
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {t('claims.compareNotice')}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {claim.linkedLostItem ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t('claims.linkedLostItem')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-5 text-sm">
                <Link
                  to={`/lost-found/items/${claim.linkedLostItem.id}`}
                  className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                  <span dir="ltr">{claim.linkedLostItem.reportNumber}</span>
                </Link>
                <p className="font-medium text-foreground">{tr(claim.linkedLostItem, 'itemTitle')}</p>
                <StatusBadge status={claim.linkedLostItem.status} />
              </CardContent>
            </Card>
          ) : null}

          {claim.claimant ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t('claims.claimant')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-5 text-sm">
                <p className="font-semibold text-foreground">
                  <bdi>{claim.claimant.name}</bdi>
                </p>
                {claim.claimant.email ? (
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{claim.claimant.email}</span>
                  </p>
                ) : null}
                {tr(claim.claimant, 'department') ? (
                  <p className="text-xs text-muted-foreground">{tr(claim.claimant, 'department')}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {claim.reviewedBy || claim.rejectionReason || claim.verificationNotes ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t('claims.reviewOutcome')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5 text-sm">
                {claim.reviewedBy ? (
                  <p className="text-xs text-muted-foreground">
                    {t('requests.reviewedBy')} <span className="font-medium text-foreground"><bdi>{claim.reviewedBy.name}</bdi></span>
                    {claim.reviewedAt
                      ? ` · ${formatDate(claim.reviewedAt, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`
                      : ''}
                  </p>
                ) : null}
                {claim.rejectionReason ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-900">
                    <p className="font-semibold">{t('claims.rejectionReason')}</p>
                    <p className="mt-1">{tr(claim, 'rejectionReason')}</p>
                  </div>
                ) : null}
                {claim.verificationNotes ? (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground">{t('claims.internalNotes')}</p>
                    <p className="mt-1 whitespace-pre-wrap">{tr(claim, 'verificationNotes')}</p>
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
                  {t('claims.handoverItem')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-5 text-sm">
                <p className="font-semibold text-emerald-950">
                  {t('claims.receivedByPerson', { name: claim.handover.receivedByName ? claim.handover.receivedByName : '' })}
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
                    {t('claims.handedOverByPerson', { name: claim.handover.handedOverBy.name })}
                  </p>
                ) : null}
                {claim.handover.notes ? (
                  <p className="pt-1 text-xs leading-relaxed text-emerald-900">
                    {tr(claim.handover, 'notes')}
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
