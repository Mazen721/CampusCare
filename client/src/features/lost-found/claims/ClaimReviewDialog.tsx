import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const ACTION_COPY: Record<
  ClaimReviewAction,
  { title: string; description: string; confirmLabel: string }
> = {
  START_VERIFICATION: {
    title: 'Start verification',
    description:
      'Compare the claimant’s answers with the private identification details on the found report. Add internal notes if another officer should follow up.',
    confirmLabel: 'Start verification',
  },
  APPROVE: {
    title: 'Approve this claim',
    description:
      'The found item becomes approved for handover and every other pending claim for the item is rejected automatically. The claimant is notified.',
    confirmLabel: 'Approve claim',
  },
  REJECT: {
    title: 'Reject this claim',
    description:
      'The claimant sees the rejection reason. The item returns to the queue when no other active claim remains.',
    confirmLabel: 'Reject claim',
  },
};

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
          ? `Claim ${claim.claimNumber} approved for handover.`
          : input === 'REJECT'
            ? `Claim ${claim.claimNumber} rejected.`
            : `Verification started for ${claim.claimNumber}.`,
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to review this claim.',
      );
    },
  });

  if (!action) {
    return null;
  }

  const copy = ACTION_COPY[action];

  function submit(): void {
    if (!action) return;
    if (action === 'REJECT' && rejectionReason.trim().length < 3) {
      setReasonError('Give the claimant a rejection reason of at least 3 characters');
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
            label="Rejection reason"
            error={reasonError ?? undefined}
            hint="This is shared with the claimant."
            required
          >
            <Textarea
              id="claim-rejection-reason"
              rows={3}
              maxLength={1000}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="The identifying details do not match the private details on the found report."
              aria-invalid={Boolean(reasonError)}
            />
          </FormField>
        ) : null}

        <FormField
          id="claim-review-notes"
          label={action === 'REJECT' ? 'Internal notes (optional)' : 'Internal notes'}
          hint={
            action === 'REJECT'
              ? 'Only Lost & Found Officers can see internal notes.'
              : 'Optional context for the next officer who reviews this claim.'
          }
        >
          <Textarea
            id="claim-review-notes"
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Verified the hidden engraving against the photo on file…"
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reviewMutation.isPending}
          >
            Cancel
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
