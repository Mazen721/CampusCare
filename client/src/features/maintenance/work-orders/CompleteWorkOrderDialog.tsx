import { CheckCircle2, Loader2 } from 'lucide-react';
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
import { ApiError } from '@/lib/api';
import type { WorkOrderRecord } from '@/types/workOrders';

interface CompleteWorkOrderDialogProps {
  workOrder: WorkOrderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteWorkOrderDialog({
  workOrder,
  open,
  onOpenChange,
}: CompleteWorkOrderDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: () => {
      if (!workOrder) throw new Error('No work order selected');
      if (resolutionDetails.trim().length < 5) {
        throw new Error(t('workOrders.resolutionMinChars'));
      }
      return workOrdersApi.complete(workOrder.id, {
        resolutionDetails: resolutionDetails.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ['request'] });
      toast.success(t('workOrders.workOrderCompletedSuccess'));
      setResolutionDetails('');
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
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            {t('workOrders.completeWork')}
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
            <p>{errorMsg}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            completeMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField
            id="resolution-details"
            label={t('workOrders.resolutionDetails')}
            hint={t('workOrders.resolutionPlaceholder')}
            required
          >
            <Textarea
              id="resolution-details"
              placeholder={t('workOrders.resolutionPlaceholder')}
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              rows={4}
              required
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={completeMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={
                completeMutation.isPending || resolutionDetails.trim().length < 5
              }
            >
              {completeMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {t('workOrders.completeWork')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
