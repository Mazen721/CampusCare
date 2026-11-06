import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Wrench,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { formatDate, getInitials } from '@/lib/utils';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { TechnicianActiveTask } from '@/types/technicians';

interface TechnicianDetailDialogProps {
  technicianId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function TechnicianDetailDialog({
  technicianId,
  open,
  onOpenChange,
  onEdit,
}: TechnicianDetailDialogProps) {
  const {
    data: technician,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['technician', technicianId],
    queryFn: () => techniciansApi.get(technicianId!),
    enabled: open && Boolean(technicianId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Technician Profile</DialogTitle>
          <DialogDescription>
            Live performance metrics, active work assignments, and specializations.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading technician metrics...
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-destructive">
            Failed to load technician details. Please try again.
          </div>
        )}

        {technician && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b pb-4">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                  {getInitials(technician.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {technician.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      technician.availability === 'AVAILABLE'
                        ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                        : technician.availability === 'BUSY'
                        ? 'border-amber-500/40 bg-amber-50 text-amber-700'
                        : 'border-slate-500/40 bg-slate-50 text-slate-700'
                    }
                  >
                    {technician.availability === 'AVAILABLE'
                      ? 'Available'
                      : technician.availability === 'BUSY'
                      ? 'Busy'
                      : 'Off Duty'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{technician.email}</p>
                {technician.contactPhone && (
                  <p className="text-xs text-muted-foreground">{technician.contactPhone}</p>
                )}
              </div>
            </div>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center text-amber-500 mb-1">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {technician.activeWorkOrderCount}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Active Tasks
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center text-emerald-500 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {technician.completedWorkOrderCount}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Completed
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center text-amber-400 mb-1">
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {technician.averageRating !== null
                    ? `${technician.averageRating.toFixed(1)} / 5`
                    : '—'}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Rating
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center text-blue-500 mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {technician.averageResolutionHours !== null
                    ? `${technician.averageResolutionHours}h`
                    : '—'}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Resolution
                </div>
              </div>
            </div>

            {/* Specializations & Skills */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Specializations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(technician.specializations ?? []).length > 0 ? (
                    technician.specializations.map((spec: string) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">General maintenance</span>
                  )}
                </div>
              </div>

              {(technician.skills ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Skills & Certifications
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {technician.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Tasks List */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Active Assignments ({technician.activeTasks.length})
              </h4>
              {technician.activeTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No active work orders currently assigned.
                </p>
              ) : (
                <div className="space-y-2">
                  {technician.activeTasks.map((task: TechnicianActiveTask) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {task.workOrderNumber}
                          </span>
                          <PriorityBadge priority={task.priority as any} />
                          <StatusBadge status={task.status as any} />
                        </div>
                        <p className="mt-1 font-medium text-foreground truncate">{task.title}</p>
                        {task.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {task.location.buildingName} • Floor {task.location.floor} • Room {task.location.room}
                          </p>
                        )}
                      </div>
                      {task.expectedCompletion && (
                        <div className="shrink-0 text-right text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {formatDate(task.expectedCompletion)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              Edit Details
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
