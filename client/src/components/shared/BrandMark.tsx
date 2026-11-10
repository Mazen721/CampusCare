import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  inverted?: boolean;
  portal?: boolean;
  compactOnMobile?: boolean;
  className?: string;
}

export function BrandMark({
  inverted = false,
  portal = false,
  compactOnMobile = false,
  className,
}: BrandMarkProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center', compactOnMobile ? 'gap-1.5 sm:gap-3' : 'gap-3', className)}>
      {portal ? (
        <img
          src="/Mansoura%20National%20University%20Emblem.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className={cn(
            'shrink-0 rounded-full bg-white object-contain ring-1',
            compactOnMobile ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10',
            inverted ? 'ring-white/25' : 'ring-border',
          )}
        />
      ) : (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl shadow-sm ring-1',
            compactOnMobile ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10',
            inverted
              ? 'bg-white/10 text-white ring-white/15'
              : 'bg-primary text-primary-foreground ring-primary/20',
          )}
        >
          <Landmark className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p
          className={cn(
            'truncate leading-tight tracking-tight',
            portal ? 'text-base font-bold tracking-[-0.02em]' : 'text-[15px] font-semibold',
            compactOnMobile && portal && 'text-sm sm:text-base',
            inverted ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          CampusCare
        </p>
        <p
          className={cn(
            'truncate font-medium',
            compactOnMobile && 'hidden sm:block',
            portal
              ? 'text-xs ltr:tracking-normal rtl:tracking-normal'
              : 'text-[10px] uppercase tracking-[0.18em]',
            inverted ? 'text-sidebar-muted' : 'text-muted-foreground',
          )}
        >
          {t('meta.tagline')}
        </p>
      </div>
    </div>
  );
}
