import { MessageSquarePlus, Loader2 } from 'lucide-react';
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

interface AddNoteDialogProps {
  workOrder: WorkOrderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({
  workOrder,
  open,
  onOpenChange,
}: AddNoteDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addNoteMutation = useMutation({
    mutationFn: () => {
      if (!workOrder) throw new Error('No work order selected');
      if (!note.trim()) throw new Error('Note cannot be empty');
      return workOrdersApi.addNote(workOrder.id, { note: note.trim() });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success(t('workOrders.noteAddedSuccess'));
      setNote('');
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
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            {t('workOrders.addNoteTitle')}
          </DialogTitle>
          <DialogDescription>
            <span dir="ltr">{workOrder?.workOrderNumber}</span> — {t('workOrders.notesSubtitle')}
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
            addNoteMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField
            id="wo-note"
            label={t('common.notes')}
            hint={t('workOrders.notePlaceholder')}
            required
          >
            <Textarea
              id="wo-note"
              placeholder={t('workOrders.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addNoteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={addNoteMutation.isPending || !note.trim()}
            >
              {addNoteMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {t('workOrders.addNote')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
