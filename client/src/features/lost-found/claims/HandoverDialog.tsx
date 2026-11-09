import { Handshake, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { ApiError } from '@/lib/api';
import type { ClaimRecord } from '@/types/claims';

interface HandoverDialogProps {
  claim: ClaimRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HandoverDialog({ claim, open, onOpenChange }: HandoverDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [receivedByName, setReceivedByName] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReceivedByName(claim.claimant?.name ?? '');
      setNotes('');
      setNameError(null);
    }
  }, [open, claim.claimant?.name]);

  const handoverMutation = useMutation({
    mutationFn: () =>
      claimsApi.handover(claim.id, {
        receivedByName: receivedByName.trim(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claims'] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claim', claim.id] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-item', claim.item?.id] });
      toast.success(t('claims.handoverSuccess'));
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('errors.generic'),
      );
    },
  });

  function submit(): void {
    if (receivedByName.trim().length < 2) {
      setNameError(t('validation.fieldRequired', { field: t('claims.receivedByName') }));
      return;
    }
    setNameError(null);
    handoverMutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !handoverMutation.isPending && onOpenChange(nextOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('claims.recordHandoverTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('claims.recordHandoverDesc')}
          </DialogDescription>
        </DialogHeader>

        <FormField
          id="handover-received-by"
          label={t('claims.receivedByName')}
          error={nameError ?? undefined}
          hint={t('claims.whoCollected')}
          required
        >
          <Input
            id="handover-received-by"
            value={receivedByName}
            maxLength={120}
            onChange={(event) => setReceivedByName(event.target.value)}
            placeholder={t('claims.receivedByNamePlaceholder')}
            aria-invalid={Boolean(nameError)}
          />
        </FormField>

        <FormField
          id="handover-notes"
          label={t('claims.handoverNotes')}
          hint={t('claims.handoverNotesPlaceholder')}
        >
          <Textarea
            id="handover-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('claims.handoverNotesPlaceholder')}
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={handoverMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={submit} disabled={handoverMutation.isPending}>
            {handoverMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Handshake className="h-4 w-4" aria-hidden="true" />
            )}
            {t('claims.confirmHandover')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
