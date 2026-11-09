import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8 text-center shadow-panel sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          404 · Page not found
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">We could not find that page</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          The address may be incorrect, or the page may not be available to your account yet.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
