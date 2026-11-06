import { Building2, CalendarDays, Mail, Phone, Sparkles, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, getInitials } from '@/lib/utils';
import { ROLE_LABELS, type AuthUser } from '@/types/auth';

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
  value: string;
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
  const availability = user.availability?.replaceAll('_', ' ').toLowerCase();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b">
        <div className="space-y-1">
          <CardTitle>Account details</CardTitle>
          <CardDescription>The identity linked to this session.</CardDescription>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-300 bg-emerald-50 text-emerald-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-sm">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-border/70 border-t border-border/70">
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow
            icon={Building2}
            label="Department"
            value={user.department?.trim() || 'Not assigned'}
          />
          <DetailRow
            icon={Phone}
            label="Contact number"
            value={user.contactPhone?.trim() || 'Not provided'}
          />
          <DetailRow
            icon={CalendarDays}
            label="Member since"
            value={formatDate(user.createdAt)}
          />
          {user.role === 'TECHNICIAN' ? (
            <DetailRow
              icon={Sparkles}
              label="Availability"
              value={availability ? availability.replace(/^\w/, (letter) => letter.toUpperCase()) : 'Not set'}
            />
          ) : null}
        </dl>

        {user.role === 'TECHNICIAN' && user.specializations.length > 0 ? (
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Specializations
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.specializations.map((specialization) => (
                <Badge key={specialization} variant="secondary" className="font-normal">
                  {specialization.replaceAll('_', ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
