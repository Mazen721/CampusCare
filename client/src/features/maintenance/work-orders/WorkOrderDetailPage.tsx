import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquarePlus,
  Play,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { SummaryButton } from '@/features/ai/SummaryButton';
import { AddNoteDialog } from '@/features/maintenance/work-orders/AddNoteDialog';
import { AssignWorkOrderDialog } from '@/features/maintenance/work-orders/AssignWorkOrderDialog';
import { CancelWorkOrderDialog } from '@/features/maintenance/work-orders/CancelWorkOrderDialog';
import { CompleteWorkOrderDialog } from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { ApiError, getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import { formatDate, getInitials } from '@/lib/utils';

export function WorkOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const workOrderQuery = useQuery({
    queryKey: ['work-order', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('Missing work order id');
      return workOrdersApi.get(id);
    },
  });

  const startMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Missing work order id');
      return workOrdersApi.start(id);
    },
    onSuccess: async () => {
      setStartOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success(t('workOrders.workOrderStartedSuccess'));
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, t('errors.network')));
    },
  });

  const workOrder = workOrderQuery.data?.workOrder;
  const isTechnician = user?.role === 'TECHNICIAN';
  const isManager = user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'MAINTENANCE_MANAGER';
  const isAssignedTech = Boolean(
    isTechnician && workOrder?.assignedTechnician?.id === user?.id,
  );
  const canSummarize =
    isAssignedTech || user?.role === 'MAINTENANCE_MANAGER';

  const isOverdue = Boolean(
    workOrder &&
      workOrder.status !== 'COMPLETED' &&
      workOrder.status !== 'CANCELLED' &&
      workOrder.expectedCompletion &&
      new Date(workOrder.expectedCompletion).getTime() < Date.now(),
  );

  if (workOrderQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('workOrders.backToWorkOrders')}
        </Link>
        <LoadingState label={t('common.loading')} />
      </div>
    );
  }

  if (workOrderQuery.isError || !workOrder) {
    const isNotFound =
      workOrderQuery.error instanceof ApiError && workOrderQuery.error.status === 404;
    return (
      <div className="space-y-6">
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('workOrders.backToWorkOrders')}
        </Link>
        <ErrorState
          title={isNotFound ? t('errors.network') : t('errors.network')}
          message={
            getErrorMessage(workOrderQuery.error, t('errors.network'))
          }
          onRetry={isNotFound ? undefined : () => void workOrderQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/work-orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('workOrders.backToWorkOrders')}
      </Link>

      <PageHeader
        eyebrow={workOrder.workOrderNumber}
        title={workOrder.title}
        description={`${enumLabel('maintenanceCategory', workOrder.category)} · ${enumLabel('sourceType', workOrder.sourceType)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />

            {/* Technician Start action */}
            {isAssignedTech && workOrder.status === 'ASSIGNED' && (
              <Button
                onClick={() => setStartOpen(true)}
                disabled={startMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="me-1.5 h-4 w-4 rtl:rotate-180" />
                {t('workOrders.startWork')}
              </Button>
            )}

            {/* Technician Complete action */}
            {isAssignedTech && workOrder.status === 'IN_PROGRESS' && (
              <Button
                onClick={() => setCompleteOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="me-1.5 h-4 w-4" />
                {t('workOrders.completeWork')}
              </Button>
            )}

            {/* Add note (Tech or Manager) */}
            {(isAssignedTech || canManage) && (
              <Button variant="outline" onClick={() => setNoteOpen(true)}>
                <MessageSquarePlus className="me-1.5 h-4 w-4" />
                {t('workOrders.addNote')}
              </Button>
            )}

            {/* Manager Assign/Reassign action */}
            {canManage &&
              (workOrder.status === 'PENDING_ASSIGNMENT' ||
                workOrder.status === 'ASSIGNED') && (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  <UserCheck className="me-1.5 h-4 w-4" />
                  {workOrder.status === 'ASSIGNED' ? t('workOrders.reassign') : t('workOrders.assignTechnician')}
                </Button>
              )}

            {/* Manager Cancel action */}
            {canManage &&
              workOrder.status !== 'COMPLETED' &&
              workOrder.status !== 'CANCELLED' && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="me-1.5 h-4 w-4" />
                  {t('workOrders.cancel')}
                </Button>
              )}
          </div>
        }
      />

      {isOverdue && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{t('workOrders.workOrderOverdue')}</p>
            <p className="text-xs">
              {t('workOrders.overdueScheduledFor', { date: formatDate(workOrder.expectedCompletion!) })}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Main Column */}
        <div className="space-y-6">
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('workOrders.taskDescription')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {workOrder.description}
              </p>
            </CardContent>
          </Card>

          <Card className={workOrder.aiSummary ? 'border-primary/30 bg-primary/[0.03]' : undefined}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t('workOrders.issueSummary')}
                </CardTitle>
                <CardDescription>
                  {t('workOrders.issueSummaryDesc')}
                </CardDescription>
              </div>
              {canSummarize ? (
                <SummaryButton
                  workOrderId={workOrder.id}
                  hasSummary={Boolean(workOrder.aiSummary)}
                />
              ) : null}
            </CardHeader>
            <CardContent>
              {workOrder.aiSummary ? (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-foreground">
                    {workOrder.aiSummary.text}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t('workOrders.aiGeneratedAt', { date: formatDate(workOrder.aiSummary.generatedAt) })}
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {canSummarize
                    ? t('workOrders.noSummaryYet')
                    : t('workOrders.noSummaryAvailable')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resolution Details Card (if completed) */}
          {workOrder.status === 'COMPLETED' && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {t('workOrders.resolutionDetails')}
                </CardTitle>
                <CardDescription>
                  {t('workOrders.completedOn', { date: formatDate(workOrder.completedAt!) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {workOrder.resolutionDetails || t('workOrders.noResolutionDetails')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Reason Card (if cancelled) */}
          {workOrder.status === 'CANCELLED' && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  {t('workOrders.cancellationReason')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  {workOrder.cancelReason || t('workOrders.cancelledByManager')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Technician Notes Thread */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('workOrders.technicianNotes')}</CardTitle>
                <CardDescription>
                  {t('workOrders.notesSubtitle')}
                </CardDescription>
              </div>
              {(isAssignedTech || isManager) && (
                <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                  <MessageSquarePlus className="me-1.5 h-3.5 w-3.5" />
                  {t('workOrders.addNote')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {workOrder.technicianNotes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  {t('workOrders.noNotesYet')}
                </p>
              ) : (
                <div className="space-y-3">
                  {workOrder.technicianNotes.map((n, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 text-sm ${
                        n.isSystem
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-semibold text-foreground">
                          {n.isSystem ? t('workOrders.systemNote') : <bdi>{n.author.name}</bdi>}
                        </span>
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap">
                        {n.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Maintenance Request Card */}
          {workOrder.maintenanceRequestId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{t('workOrders.linkedRequest')}</span>
                  <Link
                    to={`/maintenance/requests/${workOrder.maintenanceRequestId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {t('common.view')}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  {t('workOrders.linkedRequestDesc')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Assigned Technician Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('workOrders.assignedTechnician')}</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.assignedTechnician ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(workOrder.assignedTechnician.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      <bdi>{workOrder.assignedTechnician.name}</bdi>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span dir="ltr">{workOrder.assignedTechnician.email}</span>
                    </p>
                    {workOrder.assignedTechnician.availability && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {enumLabel('availability', workOrder.assignedTechnician.availability)}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  {t('workOrders.unassigned')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Schedule & Milestones Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('workOrders.scheduleAndTimestamps')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{t('workOrders.scheduledStart')}:</span>
                <span className="font-medium text-foreground">
                  {workOrder.scheduledStart ? formatDate(workOrder.scheduledStart) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{t('workOrders.expectedCompletion')}:</span>
                <span className={`font-medium ${isOverdue ? 'text-destructive font-bold' : 'text-foreground'}`}>
                  {workOrder.expectedCompletion ? formatDate(workOrder.expectedCompletion) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{t('workOrders.actualStart')}:</span>
                <span className="font-medium text-foreground">
                  {workOrder.actualStart ? formatDate(workOrder.actualStart) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('workOrders.completedAt')}:</span>
                <span className="font-medium text-foreground">
                  {workOrder.completedAt ? formatDate(workOrder.completedAt) : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Location Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('common.location')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              {workOrder.location ? (
                <>
                  <p className="font-semibold text-foreground text-sm">
                    {workOrder.location.buildingName}
                  </p>
                  <p className="text-muted-foreground">
                    {workOrder.location.floor} · {workOrder.location.room}
                  </p>
                  {workOrder.location.locationType && (
                    <Badge variant="secondary" className="text-[10px]">
                      {enumLabel('locationType', workOrder.location.locationType)}
                    </Badge>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">{t('requests.notRecorded')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignWorkOrderDialog
        workOrder={workOrder}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />

      <CancelWorkOrderDialog
        workOrder={workOrder}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      <CompleteWorkOrderDialog
        workOrder={workOrder}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
      />

      <AddNoteDialog
        workOrder={workOrder}
        open={noteOpen}
        onOpenChange={setNoteOpen}
      />

      <ConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title={t('workOrders.confirmStartTitle')}
        description={t('workOrders.confirmStartDesc', { number: workOrder.workOrderNumber })}
        confirmLabel={t('workOrders.startWork')}
        cancelLabel={t('common.cancel')}
        isLoading={startMutation.isPending}
        onConfirm={() => startMutation.mutate()}
      />
    </div>
  );
}
