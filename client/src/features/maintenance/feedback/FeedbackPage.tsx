import { Filter, MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { feedbackApi } from '@/features/maintenance/feedback/feedbackApi';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { formatDate, getInitials } from '@/lib/utils';
import type { ServiceFeedbackRecord } from '@/types/feedback';

const PAGE_SIZE = 10;

export function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL');

  const feedbackQuery = useQuery({
    queryKey: ['feedback', { technicianFilter, page }],
    queryFn: () =>
      feedbackApi.list({
        technicianId: technicianFilter === 'ALL' ? undefined : technicianFilter,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const techniciansQuery = useQuery({
    queryKey: ['technicians', { listAll: true }],
    queryFn: () => techniciansApi.list({ limit: 100 }),
  });

  const feedbackList = feedbackQuery.data?.data ?? [];
  const total = feedbackQuery.data?.total ?? 0;
  const overallAvg = feedbackQuery.data?.averageRating;
  const perTechnician = feedbackQuery.data?.perTechnician ?? [];
  const technicians = techniciansQuery.data?.data ?? [];

  const columns: Array<DataTableColumn<ServiceFeedbackRecord>> = [
    {
      id: 'request',
      header: 'Request / WO',
      cell: (fb) => (
        <div className="min-w-0">
          {fb.requestNumber ? (
            <Link
              to={`/maintenance/requests/${fb.maintenanceRequestId}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              <span dir="ltr">{fb.requestNumber}</span>
            </Link>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">—</span>
          )}
          {fb.requestTitle && (
            <p className="truncate text-xs font-medium text-foreground max-w-[200px]">
              {fb.requestTitle}
            </p>
          )}
          {fb.workOrderNumber && (
            <Link
              to={`/work-orders/${fb.workOrderId}`}
              className="text-[11px] text-muted-foreground hover:underline block"
            >
              WO: <span dir="ltr">{fb.workOrderNumber}</span>
            </Link>
          )}
        </div>
      ),
    },
    {
      id: 'technician',
      header: 'Technician',
      cell: (fb) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {getInitials(fb.technician.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              <bdi>{fb.technician.name}</bdi>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      cell: (fb) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${
                star <= fb.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
          <span className="ms-1 text-xs font-semibold">{fb.rating}</span>
        </div>
      ),
    },
    {
      id: 'comment',
      header: 'Comment',
      cell: (fb) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[320px]">
          {fb.comment ? `"${fb.comment}"` : <span className="italic">No written comment</span>}
        </p>
      ),
    },
    {
      id: 'requester',
      header: 'Submitted By',
      cell: (fb) => (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            <bdi>{fb.requester.name}</bdi>
          </p>
          <p className="text-[11px]">{formatDate(fb.createdAt)}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Feedback"
        description="Inspect customer ratings and feedback submitted after maintenance request resolution."
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              <span className="text-3xl font-bold text-foreground">
                {overallAvg !== null && overallAvg !== undefined ? overallAvg.toFixed(1) : '—'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground self-end pb-1">out of 5.0</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Top Rated Technicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perTechnician.length === 0 ? (
              <p className="text-xs text-muted-foreground">No technician feedback yet</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {perTechnician.slice(0, 2).map((stat) => (
                  <div key={stat.technicianId} className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate max-w-[140px]">
                      <bdi>{stat.technicianName}</bdi>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {stat.averageRating.toFixed(1)} ({stat.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter by Technician:</span>
        </div>
        <select
          value={technicianFilter}
          onChange={(e) => {
            setTechnicianFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">All Technicians</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={feedbackList}
        rowKey={(fb) => fb.id}
        isLoading={feedbackQuery.isLoading}
        page={page}
        limit={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyIcon={MessageSquare}
        emptyTitle="No feedback records"
        emptyDescription="No feedback has been submitted for resolved requests yet."
      />
    </div>
  );
}
