import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_OVERVIEWS, ROLE_SCOPE } from '@/features/dashboard/roleOverview';
import type { Role } from '@/types/auth';

interface RoleAccessCardProps {
  role: Role;
}

export function RoleAccessCard({ role }: RoleAccessCardProps) {
  const overview = ROLE_OVERVIEWS[role];

  return (
    <Card>
      <CardHeader className="space-y-2 border-b">
        <CardTitle>Role at a glance</CardTitle>
        <CardDescription>{overview.summary}</CardDescription>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {ROLE_SCOPE[role]}
        </p>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-5 pt-6 sm:grid-cols-2">
        {overview.capabilities.map((capability) => {
          const Icon = capability.icon;

          return (
            <div key={capability.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{capability.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
