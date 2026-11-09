import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getErrorMessage } from '@/lib/api';
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!workOrder) throw new Error('No work order selected');
      if (reason.trim().length < 3) {
        throw new Error(t('workOrders.cancelReasonMinChars'));
      }
      return workOrdersApi.cancel(workOrder.id, { reason: reason.trim() });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ['request'] });
      toast.success(t('workOrders.workOrderCancelledSuccess'));
      setReason('');
      onOpenChange(false);
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('workOrders.cancelWork')}
          </DialogTitle>
          <DialogDescription>
            <span dir="ltr">{workOrder?.workOrderNumber}</span> — {workOrder?.title}
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
            label={t('workOrders.cancelReason')}
            hint={t('workOrders.cancelReasonPlaceholder')}
            required
          >
            <Textarea
              id="cancel-reason"
              placeholder={t('workOrders.cancelReasonPlaceholder')}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending || reason.trim().length < 3}
            >
              {cancelMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {t('workOrders.cancelWork')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
