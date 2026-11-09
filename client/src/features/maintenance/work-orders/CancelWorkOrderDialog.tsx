import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { workOrdersApi } from '@/features/maintenance/work-orders/workOrdersApi';
import { ApiError } from '@/lib/api';
import type { WorkOrderRecord } from '@/types/workOrders';

interface CancelWorkOrderDialogProps {
  workOrder: WorkOrderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelWorkOrderDialog({
  workOrder,
  open,
  onOpenChange,
}: CancelWorkOrderDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!workOrder) throw new Error('No work order selected');
      if (reason.trim().length < 3) {
        throw new Error('Cancel reason must be at least 3 characters');
      }
      return workOrdersApi.cancel(workOrder.id, { reason: reason.trim() });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ['request'] });
      toast.success('Work order cancelled. Reactive request returned to review.');
      setReason('');
      onOpenChange(false);
    },
    onError: (err) => {
      setErrorMsg(err instanceof ApiError ? err.message : (err as Error).message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancel Work Order
          </DialogTitle>
          <DialogDescription>
            Cancelling <span dir="ltr">{workOrder?.workOrderNumber}</span> is a permanent action.
            {workOrder?.sourceType === 'REACTIVE' && (
              <span className="block mt-1 text-foreground font-medium">
                The linked maintenance request will return to "Under Review" for manager re-approval.
              </span>
            )}
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            cancelMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField
            id="cancel-reason"
            label="Cancellation Reason"
            hint="Explain why this work order is being cancelled (required, min 3 characters)."
            required
          >
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Duplicate issue, contractor required, parts unavailable..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelMutation.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending || reason.trim().length < 3}
            >
              {cancelMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
