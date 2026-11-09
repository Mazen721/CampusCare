import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  const { t } = useTranslation();
  const effectiveLabel = label ?? t('common.loading');

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 p-8 text-center',
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{effectiveLabel}</p>
    </div>
  );
}
