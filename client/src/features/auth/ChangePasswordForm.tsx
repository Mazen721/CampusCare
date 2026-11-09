import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/features/auth/AuthContext';
import { getErrorMessage } from '@/lib/api';

export function createChangePasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('validation.enterCurrentPassword')),
      newPassword: z
        .string()
        .min(8, t('validation.passwordMin', { min: 8 }))
        .max(72, t('validation.passwordMax', { max: 72 })),
      confirmPassword: z.string().min(1, t('validation.confirmNewPassword')),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export type ChangePasswordSchema = ReturnType<typeof createChangePasswordSchema>;
export type ChangePasswordValues = z.infer<ChangePasswordSchema>;

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => createChangePasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setServerError(null);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success(t('auth.passwordChangedSuccess'));
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle>{t('auth.changePassword')}</CardTitle>
        </div>
        <CardDescription>
          {t('auth.changePasswordDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            <Label htmlFor="current-password">{t('auth.currentPassword')}</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
              {...register('currentPassword')}
            />
            {errors.currentPassword ? (
              <p id="current-password-error" className="text-xs font-medium text-destructive">
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={errors.newPassword ? 'new-password-error' : 'new-password-hint'}
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p id="new-password-error" className="text-xs font-medium text-destructive">
                {errors.newPassword.message}
              </p>
            ) : (
              <p id="new-password-hint" className="text-xs text-muted-foreground">
                {t('validation.passwordMin', { min: 8 })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p id="confirm-password-error" className="text-xs font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('auth.changePassword')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
