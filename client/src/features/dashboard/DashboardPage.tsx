import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { AccountSummaryCard } from '@/features/dashboard/AccountSummaryCard';
import { RoleAccessCard } from '@/features/dashboard/RoleAccessCard';
import { SessionCard } from '@/features/dashboard/SessionCard';
import { useAuth } from '@/features/auth/AuthContext';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/types/auth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const today = formatDate(new Date(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your workspace"
        title={`${getGreeting()}, ${firstName}.`}
        description={`Signed in as ${ROLE_LABELS[user.role]}. Your account and access are outlined below.`}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {today}
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <RoleAccessCard role={user.role} />
        </div>
        <div className="space-y-6">
          <AccountSummaryCard user={user} />
          <SessionCard />
        </div>
      </div>
    </div>
  );
}
