import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { matchesApi } from '@/features/lost-found/matches/matchesApi';
import { getErrorMessage } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import type { ItemMatch } from '@/types/matches';

interface MatchActionsProps {
  match: ItemMatch;
}

type PendingAction = 'CONFIRM' | 'DISMISS' | null;

export function MatchActions({ match }: MatchActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const reviewMutation = useMutation({
    mutationFn: (action: 'CONFIRM' | 'DISMISS') =>
      matchesApi.review(match.id, { action }),
    onSuccess: (_data, action) => {
      void queryClient.invalidateQueries({ queryKey: ['lost-found-matches'] });
      toast.success(
        action === 'CONFIRM'
          ? t('matches.matchConfirmedSuccess')
          : t('matches.matchDismissedSuccess'),
      );
      setPendingAction(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (match.status !== 'SUGGESTED') {
    return (
      <span className="text-xs text-muted-foreground">
        {enumLabel('status', match.status)}
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
        {t('matches.dismiss')}
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
        {t('matches.confirm')}
      </Button>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction === 'CONFIRM' ? t('matches.confirmTitle') : t('matches.dismissTitle')}
        description={
          pendingAction === 'CONFIRM'
            ? t('matches.confirmDesc')
            : t('matches.dismissDesc')
        }
        confirmLabel={pendingAction === 'CONFIRM' ? t('matches.confirm') : t('matches.dismiss')}
        tone={pendingAction === 'CONFIRM' ? 'default' : 'destructive'}
        isLoading={reviewMutation.isPending}
        onConfirm={() => {
          if (pendingAction) reviewMutation.mutate(pendingAction);
        }}
      />
    </div>
  );
}
