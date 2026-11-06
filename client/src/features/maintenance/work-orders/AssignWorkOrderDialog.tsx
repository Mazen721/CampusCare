import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/input';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { ApiError } from '@/lib/api';
import type { WorkOrderRecord } from '@/types/workOrders';
import type { TechnicianRecord } from '@/types/technicians';

interface AssignWorkOrderDialogProps {
  workOrder: WorkOrderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignWorkOrderDialog({
  workOrder,
  open,
  onOpenChange,
}: AssignWorkOrderDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [scheduledStart, setScheduledStart] = useState<string>('');
  const [expectedCompletion, setExpectedCompletion] = useState<string>('');
  const [confirmedNonMatching, setConfirmedNonMatching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch technicians ordered by category match
  const { data: techData, isLoading: techLoading } = useQuery({
    queryKey: ['technicians', { category: workOrder?.category }],
    queryFn: () => techniciansApi.list({ category: workOrder?.category, limit: 100 }),
    enabled: open && Boolean(workOrder),
  });

  const technicians = techData?.data ?? [];
  const selectedTech = technicians.find((t: TechnicianRecord) => t.id === selectedTechId);
  const isSpecialistMatch = selectedTech?.matchesCategory ?? false;

  useEffect(() => {
    if (!open || !workOrder) return;
    setErrorMsg(null);
    setConfirmedNonMatching(false);

    // Initial default dates (now and +4 hours) in local time for datetime-local
    const now = new Date();
    const future = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatForInput = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setSelectedTechId(workOrder.assignedTechnician?.id ?? '');
    setScheduledStart(
      workOrder.scheduledStart
        ? formatForInput(new Date(workOrder.scheduledStart))
        : formatForInput(now),
    );
    setExpectedCompletion(
      workOrder.expectedCompletion
        ? formatForInput(new Date(workOrder.expectedCompletion))
        : formatForInput(future),
    );
  }, [open, workOrder]);

  const assignMutation = useMutation({
    mutationFn: () => {
      if (!workOrder) throw new Error('No work order selected');
      if (!selectedTechId) throw new Error('Please select a technician');
      if (!scheduledStart || !expectedCompletion) throw new Error('Dates are required');

      const start = new Date(scheduledStart);
      const end = new Date(expectedCompletion);
      if (end <= start) {
        throw new Error('Expected completion date must be after scheduled start date');
      }

      if (!isSpecialistMatch && !confirmedNonMatching) {
        throw new Error('Please confirm assigning a non-matching technician');
      }

      return workOrdersApi.assign(workOrder.id, {
        technicianId: selectedTechId,
        scheduledStart: start.toISOString(),
        expectedCompletion: end.toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ['request'] });
      toast.success(
        workOrder?.assignedTechnician
          ? 'Work order reassigned'
          : 'Work order assigned',
      );
      onOpenChange(false);
    },
    onError: (err) => {
      setErrorMsg(err instanceof ApiError ? err.message : (err as Error).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    assignMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {workOrder?.assignedTechnician ? 'Reassign Work Order' : 'Assign Work Order'}
          </DialogTitle>
          <DialogDescription>
            {workOrder?.workOrderNumber} — {workOrder?.title} ({workOrder?.category})
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="assign-tech"
            label="Select Technician"
            hint="Matching specialists are listed first with their active workload."
            required
          >
            {techLoading ? (
              <div className="text-xs text-muted-foreground py-2">Loading technicians...</div>
            ) : (
              <select
                id="assign-tech"
                value={selectedTechId}
                onChange={(e) => {
                  setSelectedTechId(e.target.value);
                  setConfirmedNonMatching(false);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">-- Choose a technician --</option>
                {technicians
                  .filter((t: TechnicianRecord) => t.isActive !== false)
                  .map((t: TechnicianRecord) => (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={t.availability === 'OFF_DUTY'}
                    >
                      {t.matchesCategory ? '⭐ ' : ''}
                      {t.name} ({t.availability}) — {t.activeWorkOrderCount} active tasks
                      {t.availability === 'OFF_DUTY' ? ' [OFF DUTY]' : ''}
                    </option>
                  ))}
              </select>
            )}
          </FormField>

          {/* Non-matching confirmation warning */}
          {selectedTech && !isSpecialistMatch && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  {selectedTech.name} does not specialize in{' '}
                  <span className="font-bold underline">{workOrder?.category}</span>.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium pt-1">
                <input
                  type="checkbox"
                  checked={confirmedNonMatching}
                  onChange={(e) => setConfirmedNonMatching(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                Confirm assigning non-specialist technician
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="scheduled-start" label="Scheduled Start" required>
              <Input
                id="scheduled-start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                required
              />
            </FormField>

            <FormField id="expected-end" label="Expected Completion" required>
              <Input
                id="expected-end"
                type="datetime-local"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                required
              />
            </FormField>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                assignMutation.isPending ||
                !selectedTechId ||
                (Boolean(selectedTech && !isSpecialistMatch && !confirmedNonMatching))
              }
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {workOrder?.assignedTechnician ? 'Reassign' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
