import { Info } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';
import { useAuth } from '@/features/auth/AuthContext';
import { AccountSummaryCard } from '@/features/dashboard/AccountSummaryCard';

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Review the account your administrator created and keep your sign-in credentials current."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <AccountSummaryCard user={user} />
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Name, role, department and contact details are managed by campus administration.
              Contact an administrator if something needs to change.
            </p>
          </div>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
