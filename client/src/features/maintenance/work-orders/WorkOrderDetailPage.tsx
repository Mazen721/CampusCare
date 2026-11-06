import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquarePlus,
  Play,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { AddNoteDialog } from '@/features/maintenance/work-orders/AddNoteDialog';
import { AssignWorkOrderDialog } from '@/features/maintenance/work-orders/AssignWorkOrderDialog';
import { CancelWorkOrderDialog } from '@/features/maintenance/work-orders/CancelWorkOrderDialog';
import { CompleteWorkOrderDialog } from '@/features/maintenance/work-orders/CompleteWorkOrderDialog';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { ApiError } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

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
      await queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order marked as in progress');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Unable to start work order');
    },
  });

  const workOrder = workOrderQuery.data?.workOrder;
  const isTechnician = user?.role === 'TECHNICIAN';
  const isManager = user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'MAINTENANCE_MANAGER';
  const isAssignedTech = Boolean(
    isTechnician && workOrder?.assignedTechnician?.id === user?.id,
  );

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
          <ArrowLeft className="h-4 w-4" />
          Back to work orders
        </Link>
        <LoadingState label="Loading work order details…" />
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
          <ArrowLeft className="h-4 w-4" />
          Back to work orders
        </Link>
        <ErrorState
          title={isNotFound ? 'Work order not found' : 'Unable to load work order'}
          message={
            workOrderQuery.error instanceof ApiError
              ? workOrderQuery.error.message
              : 'Check your connection and try again.'
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
        <ArrowLeft className="h-4 w-4" />
        Back to work orders
      </Link>

      <PageHeader
        eyebrow={workOrder.workOrderNumber}
        title={workOrder.title}
        description={`${workOrder.category} · ${workOrder.sourceType} Work Order`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={workOrder.status as any} />
            <PriorityBadge priority={workOrder.priority} />

            {/* Technician Start action */}
            {isAssignedTech && workOrder.status === 'ASSIGNED' && (
              <Button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Start Work
              </Button>
            )}

            {/* Technician Complete action */}
            {isAssignedTech && workOrder.status === 'IN_PROGRESS' && (
              <Button
                onClick={() => setCompleteOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Complete
              </Button>
            )}

            {/* Add note (Tech or Manager) */}
            {(isAssignedTech || canManage) && (
              <Button variant="outline" onClick={() => setNoteOpen(true)}>
                <MessageSquarePlus className="mr-1.5 h-4 w-4" />
                Add Note
              </Button>
            )}

            {/* Manager Assign/Reassign action */}
            {canManage &&
              (workOrder.status === 'PENDING_ASSIGNMENT' ||
                workOrder.status === 'ASSIGNED') && (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  {workOrder.status === 'ASSIGNED' ? 'Reassign' : 'Assign Technician'}
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
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              )}
          </div>
        }
      />

      {isOverdue && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Work Order Overdue</p>
            <p className="text-xs">
              This task was scheduled to be completed by {formatDate(workOrder.expectedCompletion!)}.
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
              <CardTitle className="text-base">Task Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {workOrder.description}
              </p>
            </CardContent>
          </Card>

          {/* Resolution Details Card (if completed) */}
          {workOrder.status === 'COMPLETED' && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Resolution Details
                </CardTitle>
                <CardDescription>
                  Completed on {formatDate(workOrder.completedAt!)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {workOrder.resolutionDetails || 'No resolution details recorded.'}
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
                  Cancellation Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  {workOrder.cancelReason || 'Cancelled by maintenance manager.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Technician Notes Thread */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Technician Notes</CardTitle>
                <CardDescription>
                  Internal operational notes and activity records
                </CardDescription>
              </div>
              {(isAssignedTech || isManager) && (
                <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                  <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                  Add Note
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {workOrder.technicianNotes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No notes recorded yet.
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
                          {n.isSystem ? 'System Note' : n.author.name}
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
                  <span>Linked Maintenance Request</span>
                  <Link
                    to={`/maintenance/requests/${workOrder.maintenanceRequestId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View Request
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  This work order was created from an approved user maintenance request.
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
              <CardTitle className="text-base">Assigned Technician</CardTitle>
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
                      {workOrder.assignedTechnician.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {workOrder.assignedTechnician.email}
                    </p>
                    {workOrder.assignedTechnician.availability && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {workOrder.assignedTechnician.availability}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  Not assigned yet. Manager assignment required.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Schedule & Milestones Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule & Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Scheduled Start:</span>
                <span className="font-medium text-foreground">
                  {workOrder.scheduledStart ? formatDate(workOrder.scheduledStart) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Expected Completion:</span>
                <span className={`font-medium ${isOverdue ? 'text-destructive font-bold' : 'text-foreground'}`}>
                  {workOrder.expectedCompletion ? formatDate(workOrder.expectedCompletion) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Actual Start:</span>
                <span className="font-medium text-foreground">
                  {workOrder.actualStart ? formatDate(workOrder.actualStart) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed At:</span>
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
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              {workOrder.location ? (
                <>
                  <p className="font-semibold text-foreground text-sm">
                    {workOrder.location.buildingName}
                  </p>
                  <p className="text-muted-foreground">
                    Floor {workOrder.location.floor} · Room {workOrder.location.room}
                  </p>
                  {workOrder.location.locationType && (
                    <Badge variant="secondary" className="text-[10px]">
                      {workOrder.location.locationType}
                    </Badge>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Location not recorded</p>
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
    </div>
  );
}
