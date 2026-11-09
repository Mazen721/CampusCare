import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { aiApi } from '@/features/ai/aiApi';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SummaryButtonProps {
  workOrderId: string;
  hasSummary?: boolean;
  className?: string;
}

export function SummaryButton({
  workOrderId,
  hasSummary = false,
  className,
}: SummaryButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  const summarizeMutation = useMutation({
    mutationFn: () => aiApi.summarizeWorkOrder(workOrderId),
    onMutate: () => {
      setFallbackMessage(null);
    },
    onSuccess: async (result) => {
      if (!result.available) {
        const message = result.message ?? t('ai.unavailable');
        setFallbackMessage(message);
        toast.error(message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success(
        hasSummary ? t('workOrders.aiSummary') : t('ai.summary'),
      );
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFallbackMessage(message);
      toast.error(message);
    },
  });

  return (
    <div className={cn('space-y-1.5 sm:text-end', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => summarizeMutation.mutate()}
        disabled={summarizeMutation.isPending}
        aria-busy={summarizeMutation.isPending}
      >
        {summarizeMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {summarizeMutation.isPending ? t('ai.summarizing') : t('ai.summarizeWithAi')}
      </Button>
      {fallbackMessage ? (
        <p className="max-w-xs text-[11px] leading-relaxed text-destructive" role="status">
          {fallbackMessage}
        </p>
      ) : null}
    </div>
  );
}
