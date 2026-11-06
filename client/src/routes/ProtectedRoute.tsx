import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { BrandMark } from '@/components/shared/BrandMark';
import { useAuth } from '@/features/auth/AuthContext';
import type { Role } from '@/types/auth';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
        <BrandMark />
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Restoring your session…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
