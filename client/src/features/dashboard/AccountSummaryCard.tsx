import { Building2, CalendarDays, Mail, Phone, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { enumLabel } from '@/lib/labels';
import { formatDate, getInitials } from '@/lib/utils';
import { tr } from '@/i18n/localize';
import type { AuthUser } from '@/types/auth';

interface AccountSummaryCardProps {
  user: AuthUser;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm text-foreground">{value}</dd>
      </div>
    </div>
  );
}

export function AccountSummaryCard({ user }: AccountSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b">
        <div className="space-y-1">
          <CardTitle>{t('auth.accountDetails')}</CardTitle>
          <CardDescription>{t('auth.sessionSecurityDesc')}</CardDescription>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-300 bg-emerald-50 text-emerald-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {user.isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-sm">
              {getInitials(tr(user, 'name') || user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              <bdi>{tr(user, 'name') || user.name}</bdi>
            </p>
            <p className="text-xs text-muted-foreground">{enumLabel('role', user.role)}</p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-border/70 border-t border-border/70">
          <DetailRow icon={Mail} label={t('auth.email')} value={<span dir="ltr">{user.email}</span>} />
          <DetailRow
            icon={Building2}
            label={t('auth.department')}
            value={tr(user, 'department') || t('auth.notAssigned')}
          />
          <DetailRow
            icon={Phone}
            label={t('auth.contactPhone')}
            value={user.contactPhone?.trim() ? <span dir="ltr">{user.contactPhone.trim()}</span> : t('auth.notProvided')}
          />
          <DetailRow
            icon={CalendarDays}
            label={t('auth.memberSince')}
            value={formatDate(user.createdAt)}
          />
          {user.role === 'TECHNICIAN' ? (
            <DetailRow
              icon={Sparkles}
              label={t('technicians.availability')}
              value={user.availability ? enumLabel('availability', user.availability) : t('auth.notSet')}
            />
          ) : null}
        </dl>

        {user.role === 'TECHNICIAN' && user.specializations.length > 0 ? (
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t('technicians.specializations')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.specializations.map((specialization) => (
                <Badge key={specialization} variant="secondary" className="font-normal">
                  {enumLabel('maintenanceCategory', specialization)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
