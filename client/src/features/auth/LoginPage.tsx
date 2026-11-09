import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Loader2,
  PackageSearch,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { BrandMark } from '@/components/shared/BrandMark';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/features/auth/AuthContext';
import { getErrorMessage, isDemoModeEnabled } from '@/lib/api';
import { enumLabel } from '@/lib/labels';
import type { Role } from '@/types/auth';

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.email'))
      .email(t('validation.email')),
    password: z.string().min(1, t('validation.required')),
  });
}

export type LoginSchema = ReturnType<typeof createLoginSchema>;
export type LoginValues = z.infer<LoginSchema>;

const DEMO_ROLES: Array<{ role: Role; icon: typeof ShieldCheck }> = [
  { role: 'SUPER_ADMIN', icon: ShieldCheck },
  { role: 'MAINTENANCE_MANAGER', icon: ClipboardList },
  { role: 'TECHNICIAN', icon: Wrench },
  { role: 'LOST_FOUND_OFFICER', icon: PackageSearch },
  { role: 'STUDENT_EMPLOYEE', icon: GraduationCap },
];

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeDemoRole, setActiveDemoRole] = useState<Role | null>(null);
  const demoEnabled = isDemoModeEnabled();

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const destination =
    (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
      toast.success(t('auth.signedOut'));
      navigate(destination === '/login' ? '/dashboard' : destination, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  const onDemoLogin = async (role: Role) => {
    setServerError(null);
    setActiveDemoRole(role);
    try {
      await demoLogin(role);
      toast.success(enumLabel('role', role));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setActiveDemoRole(null);
    }
  };

  return (
    <main className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute top-4 end-4 z-20">
        <LanguageToggle />
      </div>
      <section className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -end-28 top-20 h-80 w-80 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full border border-white/10"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col">
          <BrandMark inverted />

          <div className="my-auto max-w-xl py-16">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-active/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              CampusCare
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-sidebar-foreground xl:text-6xl">
              CampusCare
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-sidebar-muted">
              {t('meta.description')}
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-active text-amber-300">
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{t('nav.maintenance')}</p>
                  <p className="text-xs leading-relaxed text-sidebar-muted">
                    {t('requests.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-active text-amber-300">
                  <PackageSearch className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{t('nav.lostFound')}</p>
                  <p className="text-xs leading-relaxed text-sidebar-muted">
                    {t('lostFound.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-active text-amber-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{t('dashboard.roleAtAGlance')}</p>
                  <p className="text-xs leading-relaxed text-sidebar-muted">
                    {t('auth.demoDisclaimer')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative text-[11px] uppercase tracking-[0.18em] text-sidebar-muted/80">
            {t('nav.maintenance')} · {t('nav.lostFound')} · {t('nav.users')}
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                className="text-start"
                placeholder="you@mansnu.edu.eg"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="email-error" className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <PasswordInput
                id="password"
                placeholder={t('auth.password')}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <p id="password-error" className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('auth.signIn')}
              {!isSubmitting ? (
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              ) : null}
            </Button>
          </form>

          {demoEnabled ? (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t('auth.quickDemoAccess')}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                {t('auth.demoDisclaimer')}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DEMO_ROLES.map(({ role, icon: Icon }) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={() => void onDemoLogin(role)}
                    disabled={activeDemoRole !== null || isSubmitting}
                  >
                    {activeDemoRole === role ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                    {enumLabel('role', role)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
