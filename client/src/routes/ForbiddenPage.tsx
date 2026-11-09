import { ArrowLeft, ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { enumLabel } from '@/lib/labels';

export function ForbiddenPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8 text-center shadow-panel sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-destructive">
          403 · {t('errors.forbiddenTitle')}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">{t('errors.forbiddenTitle')}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {user
            ? t('errors.forbiddenRoleDesc', { role: enumLabel('role', user.role) })
            : t('errors.forbiddenAccountDesc')}{' '}
          {t('errors.forbiddenContactAdmin')}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t('errors.backToDashboard')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/profile">{t('errors.viewProfile')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
