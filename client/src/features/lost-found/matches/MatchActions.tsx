import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { ApiError } from '@/lib/api';
import type { ItemMatch } from '@/types/matches';

interface MatchActionsProps {
  match: ItemMatch;
}

type PendingAction = 'CONFIRM' | 'DISMISS' | null;

export function MatchActions({ match }: MatchActionsProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const reviewMutation = useMutation({
    mutationFn: (action: 'CONFIRM' | 'DISMISS') =>
      matchesApi.review(match.id, { action }),
    onSuccess: (_data, action) => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-matches'] });
      toast.success(
        action === 'CONFIRM'
          ? 'Match confirmed. The lost reporter can now submit a claim.'
          : 'Match suggestion dismissed.',
      );
      setPendingAction(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to review this match.',
      );
    },
  });

  if (match.status !== 'SUGGESTED') {
    return (
      <span className="text-xs text-muted-foreground">
        {match.status === 'CONFIRMED' ? 'Confirmed' : 'Dismissed'}
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setPendingAction('DISMISS')}
        disabled={reviewMutation.isPending}
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Dismiss
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => setPendingAction('CONFIRM')}
        disabled={reviewMutation.isPending}
      >
        {reviewMutation.isPending && pendingAction === 'CONFIRM' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Confirm
      </Button>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction === 'CONFIRM' ? 'Confirm this match?' : 'Dismiss this match?'}
        description={
          pendingAction === 'CONFIRM'
            ? 'Both items will be marked as match confirmed and the lost reporter will be notified with a claim link.'
            : 'The suggestion will be dismissed and will not be recreated by recalculation.'
        }
        confirmLabel={pendingAction === 'CONFIRM' ? 'Confirm match' : 'Dismiss match'}
        tone={pendingAction === 'CONFIRM' ? 'default' : 'destructive'}
        isLoading={reviewMutation.isPending}
        onConfirm={() => {
          if (pendingAction) reviewMutation.mutate(pendingAction);
        }}
      />
    </div>
  );
}
