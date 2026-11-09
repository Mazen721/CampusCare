import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { usersApi } from '@/features/users/usersApi';
import { ApiError } from '@/lib/api';
import { ROLES, ROLE_LABELS, type Role } from '@/types/auth';
import {
  MAINTENANCE_CATEGORIES,
  TECHNICIAN_AVAILABILITIES,
  type MaintenanceCategory,
} from '@/types/meta';
import type { UserRecord } from '@/types/users';

const userFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().optional(),
  role: z.enum(ROLES),
  department: z.string().trim().max(120, 'Department must be 120 characters or fewer').optional(),
  contactPhone: z.string().trim().max(40, 'Phone must be 40 characters or fewer').optional(),
  specializations: z.array(z.enum(MAINTENANCE_CATEGORIES)),
  skillsText: z.string().max(2000, 'Skills must be 2000 characters or fewer').optional(),
  availability: z.enum(TECHNICIAN_AVAILABILITIES),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const EMPTY_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'STUDENT_EMPLOYEE',
  department: '',
  contactPhone: '',
  specializations: [],
  skillsText: '',
  availability: 'AVAILABLE',
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRecord | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(user);

  const resolverSchema = useMemo(
    () =>
      userFormSchema.superRefine((values, context) => {
        if (isEditing) return;
        if (!values.password) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'A password is required for a new account',
          });
        } else if (values.password.length < 8 || values.password.length > 72) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'Password must be between 8 and 72 characters',
          });
        }
      }),
    [isEditing],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(resolverSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset(
      user
        ? {
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department ?? '',
            contactPhone: user.contactPhone ?? '',
            specializations: (user.specializations ?? []) as MaintenanceCategory[],
            skillsText: (user.skills ?? []).join(', '),
            availability: user.availability ?? 'AVAILABLE',
          }
        : EMPTY_VALUES,
    );
  }, [open, user, reset]);

  const saveUser = useMutation({
    mutationFn: (values: UserFormValues) => {
      const isTechnician = values.role === 'TECHNICIAN';
      const shared = {
        name: values.name,
        email: values.email,
        role: values.role,
        department: values.department?.trim() || undefined,
        contactPhone: values.contactPhone?.trim() || undefined,
        specializations: isTechnician ? values.specializations : [],
        skills: isTechnician
          ? (values.skillsText ?? '')
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean)
          : [],
        availability: isTechnician ? values.availability : undefined,
      };

      return user
        ? usersApi.update(user.id, shared)
        : usersApi.create({ ...shared, password: values.password ?? '' });
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    setServerError(null);
    try {
      await saveUser.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(isEditing ? 'User account updated' : 'User account created');
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Unable to save this account. Try again.',
      );
    }
  };

  const selectedRole = watch('role');
  const selectedSpecializations = watch('specializations');
  const isTechnician = selectedRole === 'TECHNICIAN';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit user account' : 'Create user account'}</DialogTitle>
          <DialogDescription>
            Accounts are created by administrators. Technician accounts also carry specializations,
            skills and availability used for work assignment.
          </DialogDescription>
        </DialogHeader>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="user-name" label="Full name" error={errors.name?.message} required>
              <Input
                id="user-name"
                placeholder="Nour El-Haddad"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
            </FormField>

            <FormField id="user-email" label="Email address" error={errors.email?.message} required>
              <Input
                id="user-email"
                type="email"
                dir="ltr"
                className="text-start"
                placeholder="name@mansnu.edu.eg"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </FormField>

            {!isEditing ? (
              <FormField
                id="user-password"
                label="Temporary password"
                error={errors.password?.message}
                hint="At least 8 characters. Share it securely with the new user."
                required
              >
                <PasswordInput
                  id="user-password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
              </FormField>
            ) : null}

            <FormField id="user-role" label="Role" error={errors.role?.message} required>
              <select
                id="user-role"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-invalid={Boolean(errors.role)}
                {...register('role')}
              >
                {ROLES.map((role: Role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="user-department" label="Department" error={errors.department?.message}>
              <Input
                id="user-department"
                placeholder="Faculty of Engineering"
                aria-invalid={Boolean(errors.department)}
                {...register('department')}
              />
            </FormField>

            <FormField id="user-phone" label="Contact phone" error={errors.contactPhone?.message}>
              <Input
                id="user-phone"
                type="tel"
                dir="ltr"
                className="text-start"
                placeholder="+20 100 000 0000"
                autoComplete="tel"
                aria-invalid={Boolean(errors.contactPhone)}
                {...register('contactPhone')}
              />
            </FormField>
          </div>

          {isTechnician ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Technician profile</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Specializations help managers order technician suggestions by match.
                </p>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">
                  Specializations
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MAINTENANCE_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/60"
                    >
                      <input
                        type="checkbox"
                        value={category}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        {...register('specializations')}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
                {errors.specializations ? (
                  <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                    {errors.specializations.message}
                  </p>
                ) : null}
                {selectedSpecializations.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedSpecializations.length} selected
                  </p>
                ) : null}
              </fieldset>

              <FormField
                id="user-skills"
                label="Skills"
                error={errors.skillsText?.message}
                hint="Comma-separated, for example: HVAC repair, wiring, network cabling."
              >
                <Input
                  id="user-skills"
                  placeholder="HVAC repair, wiring, network cabling"
                  aria-invalid={Boolean(errors.skillsText)}
                  {...register('skillsText')}
                />
              </FormField>

              <FormField
                id="user-availability"
                label="Availability"
                error={errors.availability?.message}
              >
                <select
                  id="user-availability"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  {...register('availability')}
                >
                  {TECHNICIAN_AVAILABILITIES.map((availability) => (
                    <option key={availability} value={availability}>
                      {availability.replaceAll('_', ' ').toLowerCase()}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? 'Save changes' : 'Create account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
