import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
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
import { requestsApi } from '@/features/maintenance/requests/requestsApi';
import { ApiError } from '@/lib/api';
import type { MaintenanceRequestRecord } from '@/types/maintenance';

interface ReopenRequestDialogProps {
  request: MaintenanceRequestRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReopenRequestDialog({
  request,
  open,
  onOpenChange,
}: ReopenRequestDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reopenMutation = useMutation({
    mutationFn: () => {
      if (!request) throw new Error('No request selected');
      if (reason.trim().length < 5) {
        throw new Error('Reopen reason must be at least 5 characters');
      }
      return requestsApi.reopen(request.id, reason.trim());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['request', request?.id] });
      await queryClient.invalidateQueries({ queryKey: ['requests'] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Request reopened! The linked work order is back in the technician queue.');
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
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <RotateCcw className="h-5 w-5" />
            Reopen Maintenance Request
          </DialogTitle>
          <DialogDescription>
            {request?.requestNumber} — {request?.title}
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
            reopenMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField
            id="reopen-reason"
            label="Reason for Reopening"
            hint="Please explain why the issue was not fully resolved (required, min 5 characters)."
            required
          >
            <Textarea
              id="reopen-reason"
              placeholder="e.g. The leak resumed after 2 hours of normal operation..."
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
              disabled={reopenMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={reopenMutation.isPending || reason.trim().length < 5}
            >
              {reopenMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reopen Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
