import { Clock3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTokenExpiry } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function formatExpiry(expiry: Date): string {
  return formatDate(expiry, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function SessionCard() {
  const expiry = getTokenExpiry();

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle>Session &amp; security</CardTitle>
        </div>
        <CardDescription>
          You are signed in with a secure staff session. It ends automatically when the token
          expires.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session expiry
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {expiry ? formatExpiry(expiry) : 'Session expiry unavailable'}
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Use a password only you know. Accounts are issued by campus administration; there is no
          self-registration.
        </p>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/profile">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Manage password
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
