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
import { FormField } from '@/components/shared/FormField';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface DemoRoleStripProps {
  title: string;
  activeRole: Role | null;
  disabled: boolean;
  onSelect: (role: Role) => void;
}

function DemoRoleStrip({ title, activeRole, disabled, onSelect }: DemoRoleStripProps) {
  return (
    <div className="mt-4 border-t border-[hsl(var(--mnu-navy)/0.14)] pt-3.5">
      <p className="text-center text-xs font-medium text-muted-foreground">{title}</p>

      <div className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-1.5 rtl:max-w-[360px]">
        {DEMO_ROLES.map(({ role, icon: Icon }) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-[hsl(var(--mnu-navy)/0.16)] bg-white/65 px-2 text-[11.5px] font-medium text-foreground shadow-none hover:border-[hsl(var(--mnu-gold))] hover:bg-[hsl(var(--mnu-gold-tint)/0.92)] hover:text-[hsl(var(--mnu-navy))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--mnu-gold))] focus-visible:ring-offset-1"
            onClick={() => onSelect(role)}
            disabled={disabled}
          >
            {activeRole === role ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-[hsl(var(--mnu-navy))]"
                aria-hidden="true"
              />
            ) : (
              <Icon className="h-3.5 w-3.5 text-[hsl(var(--mnu-gold-ink))]" aria-hidden="true" />
            )}
            <span>{enumLabel('role', role)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function PortalBackdrop() {
  return (
    <>
      <img
        src="/Mansoura%20National%20University%20Entrance.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[hsl(var(--mnu-navy)/0.36)] via-[hsl(var(--mnu-navy)/0.44)] to-[hsl(var(--mnu-navy)/0.60)]"
      />
      <div className="fixed end-4 top-4 z-20 sm:end-6 sm:top-6">
        <LanguageToggle className="rounded-full border border-white/25 bg-[hsl(var(--mnu-navy)/0.78)] px-3.5 text-white shadow-sm backdrop-blur-md hover:border-[hsl(var(--mnu-gold)/0.85)] hover:bg-[hsl(var(--mnu-navy)/0.92)] hover:text-white focus-visible:ring-[hsl(var(--mnu-gold))] focus-visible:ring-offset-0" />
      </div>
    </>
  );
}

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

  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const isBusy = isSubmitting || activeDemoRole !== null;

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
      toast.success(t('auth.signedIn'));
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
    <main className="mnu-portal-surface relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 pb-8 pt-16 sm:px-6 sm:py-8">
      <PortalBackdrop />

      <section
        aria-labelledby="login-heading"
        className="mnu-threshold-card relative z-10 w-full max-w-[440px] rounded-2xl bg-gradient-to-b from-white/[0.82] via-white/[0.72] to-white/[0.68] px-6 py-6 text-foreground shadow-[0_24px_60px_-14px_rgba(4,21,62,0.52)] ring-1 ring-inset ring-white/75 backdrop-blur-md backdrop-saturate-150 sm:px-7 sm:py-7"
      >
        <div className="flex flex-col items-center text-center">
          <img
            src="/Mansoura%20National%20University%20Emblem.png"
            alt={t('auth.universityEmblemAlt')}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-contain drop-shadow-sm"
          />
          <h1
            id="login-heading"
            className="mt-3.5 text-[1.65rem] font-bold leading-tight tracking-[-0.02em] text-primary sm:text-[1.75rem]"
          >
            CampusCare
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <FormField id="email" label={t('auth.email')} error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="h-11 bg-white/85 text-start aria-[invalid=false]:focus-visible:border-[hsl(var(--mnu-navy))] focus-visible:ring-offset-1"
              placeholder="you@mansnu.edu.eg"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              disabled={isBusy}
              {...register('email')}
            />
          </FormField>

          <FormField id="password" label={t('auth.password')} error={errors.password?.message}>
            <PasswordInput
              id="password"
              className="h-11 bg-white/85 aria-[invalid=false]:focus-visible:border-[hsl(var(--mnu-navy))] focus-visible:ring-offset-1"
              placeholder={t('auth.password')}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              disabled={isBusy}
              {...register('password')}
            />
          </FormField>

          <Button
            type="submit"
            size="lg"
            className="mt-0.5 h-11 w-full bg-[hsl(var(--mnu-navy))] font-semibold text-white shadow-sm hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--mnu-gold))] focus-visible:ring-offset-2"
            disabled={isBusy}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            <span>{isSubmitting ? t('auth.signingIn') : t('auth.signIn')}</span>
            {!isSubmitting ? (
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            ) : null}
          </Button>
        </form>

        <p className="mx-auto mt-3 max-w-[38ch] text-balance text-center text-xs leading-relaxed text-muted-foreground">
          {t('auth.issuedAccountNotice')}
        </p>

        {demoEnabled ? (
          <DemoRoleStrip
            title={t('auth.quickDemoAccess')}
            activeRole={activeDemoRole}
            disabled={isBusy}
            onSelect={(role) => void onDemoLogin(role)}
          />
        ) : null}
      </section>
    </main>
  );
}
