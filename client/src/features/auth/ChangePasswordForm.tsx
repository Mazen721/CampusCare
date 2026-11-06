import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError } from '@/lib/api';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'New password must be 72 characters or fewer'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
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
      toast.success('Password updated. Use the new password the next time you sign in.');
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Unable to update your password right now. Please try again.',
      );
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle>Change password</CardTitle>
        </div>
        <CardDescription>
          Choose a password of at least 8 characters. You will use it the next time you sign in.
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
            <Label htmlFor="current-password">Current password</Label>
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
            <Label htmlFor="new-password">New password</Label>
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
                At least 8 characters, up to 72.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
