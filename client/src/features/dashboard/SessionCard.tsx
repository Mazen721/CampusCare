import { Clock3, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTokenExpiry } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function SessionCard() {
  const { t } = useTranslation();
  const expiry = getTokenExpiry();

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle>{t('auth.sessionAndSecurity')}</CardTitle>
        </div>
        <CardDescription>
          {t('auth.sessionSecurityDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('auth.sessionExpiry')}
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {expiry
                ? formatDate(expiry, { dateStyle: 'medium', timeStyle: 'short' })
                : t('auth.sessionExpiryUnavailable')}
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('auth.passwordPolicyNotice')}
        </p>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/profile">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t('auth.managePassword')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
