import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  EyeOff,
  MapPin,
  Palette,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { CloseItemButton } from '@/features/lost-found/items/CloseItemButton';
import { ItemGallery } from '@/features/lost-found/items/ItemGallery';
import { ReportTypeBadge } from '@/features/lost-found/items/ReportTypeBadge';
import { itemsApi } from '@/features/lost-found/items/itemsApi';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const itemQuery = useQuery({
    queryKey: ['lost-found-item', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('Missing item id');
      return itemsApi.get(id);
    },
  });

  const item = itemQuery.data?.item;

  if (itemQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          Back to browse
        </Link>
        <LoadingState label="Loading item details…" />
      </div>
    );
  }

  if (itemQuery.isError || !item) {
    const notFound =
      itemQuery.error instanceof ApiError && itemQuery.error.status === 404;
    return (
      <div className="space-y-6">
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          Back to browse
        </Link>
        <ErrorState
          title={notFound ? 'Report not found' : 'Unable to load this report'}
          message={
            itemQuery.error instanceof ApiError
              ? itemQuery.error.message
              : 'Check your connection and try again.'
          }
          onRetry={notFound ? undefined : () => void itemQuery.refetch()}
        />
      </div>
    );
  }

  const canClaim =
    user?.role === 'STUDENT_EMPLOYEE' &&
    item.reportType === 'FOUND' &&
    (item.status === 'OPEN' ||
      item.status === 'MATCH_CONFIRMED' ||
      item.status === 'CLAIM_UNDER_REVIEW');

  return (
    <div className="space-y-6">
      <Link
        to="/lost-found"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        Back to browse
      </Link>

      <PageHeader
        eyebrow={item.reportNumber}
        title={item.itemTitle}
        description={`${item.category} · ${item.reportType === 'LOST' ? 'Lost report' : 'Found report'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReportTypeBadge reportType={item.reportType} />
            <StatusBadge status={item.status} />
            {canClaim ? (
              <Button asChild>
                <Link to={`/lost-found/claims/new?itemId=${item.id}`}>
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Submit claim
                </Link>
              </Button>
            ) : null}
            <CloseItemButton item={item} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ItemGallery images={item.images} itemTitle={item.itemTitle} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Public description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {item.description}
              </p>

              <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    Category
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{item.category}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <Palette className="h-3.5 w-3.5" aria-hidden="true" />
                    Colour
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{item.color || 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Brand
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{item.brand || 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.reportType === 'LOST' ? 'Lost on' : 'Found on'}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDate(item.occurrenceDate, { dateStyle: 'long' })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-5 text-sm">
              {item.location ? (
                <>
                  <p className="font-semibold text-foreground">{item.location.buildingName}</p>
                  <p className="text-muted-foreground">
                    {item.location.floor} · Room {item.location.room}
                  </p>
                </>
              ) : null}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.locationDetails}
              </p>
            </CardContent>
          </Card>

          {item.privateIdentificationDetails ? (
            <Card className="border-amber-300/70 bg-amber-50/60">
              <CardHeader className="border-b border-amber-200/70">
                <CardTitle className="flex items-center gap-2 text-base">
                  <EyeOff className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Private identification details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {item.privateIdentificationDetails}
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Visible only to the reporter, Lost &amp; Found Officers and the Admin.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {item.reporter ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  Reporter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-5 text-sm">
                <p className="font-semibold text-foreground">
                  <bdi>{item.reporter.name}</bdi>
                </p>
                {item.reporter.email ? (
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{item.reporter.email}</span>
                  </p>
                ) : null}
                {item.reporter.department ? (
                  <p className="text-xs text-muted-foreground">{item.reporter.department}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!item.privateIdentificationDetails && !item.reporter ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Privacy protected
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 text-xs leading-relaxed text-muted-foreground">
                Private identification details and reporter contact information are hidden from
                this view. A Lost &amp; Found Officer can review them during a claim.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
