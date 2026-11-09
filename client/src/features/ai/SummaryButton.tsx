import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { aiApi } from '@/features/ai/aiApi';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SummaryButtonProps {
  workOrderId: string;
  hasSummary?: boolean;
  className?: string;
}

/**
 * Generates a work order summary or loads the saved one. AI failures are
 * surfaced as a toast while the rest of the work order page stays usable.
 */
export function SummaryButton({
  workOrderId,
  hasSummary = false,
  className,
}: SummaryButtonProps) {
  const queryClient = useQueryClient();
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  const summarizeMutation = useMutation({
    mutationFn: () => aiApi.summarizeWorkOrder(workOrderId),
    onMutate: () => {
      setFallbackMessage(null);
    },
    onSuccess: async (result) => {
      if (!result.available) {
        const message = result.message ?? 'The AI summary is not available right now.';
        setFallbackMessage(message);
        toast.error(message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success(
        hasSummary ? 'Loaded the saved AI summary' : 'AI summary generated',
      );
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to generate a summary right now. Please try again.';
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
        {summarizeMutation.isPending ? 'Summarizing…' : 'Summarize Issue with AI'}
      </Button>
      {fallbackMessage ? (
        <p className="max-w-xs text-[11px] leading-relaxed text-destructive" role="status">
          {fallbackMessage}
        </p>
      ) : null}
    </div>
  );
}
