import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { formatLocation, tr } from '@/i18n/localize';
import { enumLabel } from '@/lib/labels';
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
  const { t } = useTranslation();
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
          <DialogTitle>{t('technicians.profileTitle')}</DialogTitle>
          <DialogDescription>
            {t('technicians.profileDesc')}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t('common.loading')}
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-destructive">
            {t('errors.network')}
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
                    <bdi>{technician.name}</bdi>
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
                    {enumLabel('availability', technician.availability)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span dir="ltr">{technician.email}</span>
                </p>
                {technician.contactPhone && (
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{technician.contactPhone}</span>
                  </p>
                )}
                {tr(technician, 'department') && (
                  <p className="text-xs text-muted-foreground">
                    {tr(technician, 'department')}
                  </p>
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
                  {t('technicians.activeWorkOrders')}
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
                  {t('technicians.completedWorkOrders')}
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
                  {t('technicians.avgRating')}
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
                  {t('technicians.avgResolutionHours')}
                </div>
              </div>
            </div>

            {/* Specializations & Skills */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('technicians.specializations')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(technician.specializations ?? []).length > 0 ? (
                    technician.specializations.map((spec: string) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {enumLabel('maintenanceCategory', spec)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('technicians.generalMaintenance')}</span>
                  )}
                </div>
              </div>

              {(technician.skills ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t('technicians.skills')}
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
                {t('technicians.activeTasks')} ({technician.activeTasks.length})
              </h4>
              {technician.activeTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {t('technicians.noActiveOrders')}
                </p>
              ) : (
                <div className="space-y-2">
                  {technician.activeTasks.map((task: TechnicianActiveTask) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                    >
                      <div className="min-w-0 flex-1 pe-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            <span dir="ltr">{task.workOrderNumber}</span>
                          </span>
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                        <p className="mt-1 font-medium text-foreground truncate">{tr(task, 'title')}</p>
                        {task.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {formatLocation(task.location)}
                          </p>
                        )}
                      </div>
                      {task.expectedCompletion && (
                        <div className="shrink-0 text-end text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('technicians.dueOn', { date: formatDate(task.expectedCompletion) })}
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
              {t('common.edit')}
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
