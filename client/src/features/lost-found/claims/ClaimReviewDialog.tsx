import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { claimsApi } from '@/features/lost-found/claims/claimsApi';
import { ApiError } from '@/lib/api';
import type { ClaimRecord, ClaimReviewAction } from '@/types/claims';

interface ClaimReviewDialogProps {
  claim: ClaimRecord;
  action: ClaimReviewAction | null;
  onOpenChange: (open: boolean) => void;
}

export function ClaimReviewDialog({
  claim,
  action,
  onOpenChange,
}: ClaimReviewDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    setNotes('');
    setRejectionReason('');
    setReasonError(null);
  }, [action]);

  const reviewMutation = useMutation({
    mutationFn: (input: ClaimReviewAction) =>
      claimsApi.review(claim.id, {
        action: input,
        notes: notes.trim() || undefined,
        rejectionReason:
          input === 'REJECT' ? rejectionReason.trim() || undefined : undefined,
      }),
    onSuccess: (data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claims'] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-claim', claim.id] });
      void queryClient.invalidateQueries({ queryKey: ['lost-found-item', data.claim.item?.id] });
      toast.success(
        input === 'APPROVE'
          ? t('claims.approveAction')
          : input === 'REJECT'
            ? t('claims.rejectAction')
            : t('claims.startVerificationAction'),
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('errors.generic'),
      );
    },
  });

  if (!action) {
    return null;
  }

  const copy = {
    START_VERIFICATION: {
      title: t('claims.verifyCopyTitle'),
      description: t('claims.verifyCopyDesc'),
      confirmLabel: t('claims.startVerificationAction'),
    },
    APPROVE: {
      title: t('claims.approveCopyTitle'),
      description: t('claims.approveCopyDesc'),
      confirmLabel: t('claims.approveAction'),
    },
    REJECT: {
      title: t('claims.rejectCopyTitle'),
      description: t('claims.rejectCopyDesc'),
      confirmLabel: t('claims.rejectAction'),
    },
  }[action];

  function submit(): void {
    if (!action) return;
    if (action === 'REJECT' && rejectionReason.trim().length < 3) {
      setReasonError(t('validation.min3Chars'));
      return;
    }
    setReasonError(null);
    reviewMutation.mutate(action);
  }

  return (
    <Dialog
      open={action !== null}
      onOpenChange={(open) => !reviewMutation.isPending && onOpenChange(open)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {action === 'REJECT' ? (
          <FormField
            id="claim-rejection-reason"
            label={t('claims.rejectionReason')}
            error={reasonError ?? undefined}
            hint={t('claims.rejectionPlaceholder')}
            required
          >
            <Textarea
              id="claim-rejection-reason"
              rows={3}
              maxLength={1000}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder={t('claims.rejectionPlaceholder')}
              aria-invalid={Boolean(reasonError)}
            />
          </FormField>
        ) : null}

        <FormField
          id="claim-review-notes"
          label={action === 'REJECT' ? `${t('claims.internalNotes')} (${t('common.optional')})` : t('claims.internalNotes')}
          hint={t('claims.verificationNotes')}
        >
          <Textarea
            id="claim-review-notes"
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('claims.verificationNotes')}
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reviewMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={action === 'REJECT' ? 'destructive' : 'default'}
            onClick={submit}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
