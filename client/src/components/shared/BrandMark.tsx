import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  inverted?: boolean;
  className?: string;
}

export function BrandMark({ inverted = false, className }: BrandMarkProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1',
          inverted
            ? 'bg-white/10 text-white ring-white/15'
            : 'bg-primary text-primary-foreground ring-primary/20',
        )}
      >
        <Landmark className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'text-[15px] font-semibold leading-tight tracking-tight',
            inverted ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          CampusCare
        </p>
        <p
          className={cn(
            'text-[10px] font-medium uppercase tracking-[0.18em]',
            inverted ? 'text-sidebar-muted' : 'text-muted-foreground',
          )}
        >
          {t('meta.tagline')}
        </p>
      </div>
    </div>
  );
}
