import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getLang, setLang } from '@/i18n';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'en' || getLang() === 'en' ? 'en' : 'ar';
  const targetLang = currentLang === 'ar' ? 'en' : 'ar';
  const label = currentLang === 'ar' ? 'English' : 'العربية';

  const handleToggle = () => {
    void setLang(targetLang);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn('gap-1.5 px-2.5 font-medium text-muted-foreground hover:text-foreground', className)}
      aria-label={t('common.switchLanguage')}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
