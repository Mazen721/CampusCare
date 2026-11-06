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
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { ApiError } from '@/lib/api';
import {
  MAINTENANCE_CATEGORIES,
  TECHNICIAN_AVAILABILITIES,
  type MaintenanceCategory,
} from '@/types/meta';
import type { TechnicianRecord } from '@/types/technicians';

const technicianFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().optional(),
  department: z.string().trim().max(120, 'Department must be 120 characters or fewer').optional(),
  contactPhone: z.string().trim().max(40, 'Phone must be 40 characters or fewer').optional(),
  specializations: z.array(z.enum(MAINTENANCE_CATEGORIES)),
  skillsText: z.string().max(2000, 'Skills must be 2000 characters or fewer').optional(),
  availability: z.enum(TECHNICIAN_AVAILABILITIES),
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

const EMPTY_VALUES: TechnicianFormValues = {
  name: '',
  email: '',
  password: '',
  department: '',
  contactPhone: '',
  specializations: [],
  skillsText: '',
  availability: 'AVAILABLE',
};

interface TechnicianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician?: TechnicianRecord | null;
}

export function TechnicianFormDialog({
  open,
  onOpenChange,
  technician,
}: TechnicianFormDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(technician);

  const resolverSchema = useMemo(
    () =>
      technicianFormSchema.superRefine((values, context) => {
        if (isEditing) {
          if (values.password && (values.password.length < 8 || values.password.length > 72)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['password'],
              message: 'Password must be between 8 and 72 characters',
            });
          }
          return;
        }
        if (!values.password) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'A password is required for a new technician',
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TechnicianFormValues>({
    resolver: zodResolver(resolverSchema),
    defaultValues: EMPTY_VALUES,
  });

  const selectedSpecializations = watch('specializations');

  useEffect(() => {
    if (!open) return;
    setServerError(null);

    if (technician) {
      reset({
        name: technician.name,
        email: technician.email,
        password: '',
        department: technician.department ?? '',
        contactPhone: technician.contactPhone ?? '',
        specializations: technician.specializations ?? [],
        skillsText: (technician.skills ?? []).join(', '),
        availability: technician.availability ?? 'AVAILABLE',
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, technician, reset]);

  const toggleSpecialization = (category: MaintenanceCategory) => {
    const current = selectedSpecializations ?? [];
    if (current.includes(category)) {
      setValue(
        'specializations',
        current.filter((c) => c !== category),
        { shouldValidate: true },
      );
    } else {
      setValue('specializations', [...current, category], { shouldValidate: true });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (values: TechnicianFormValues) => {
      const skills = (values.skillsText ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (isEditing && technician) {
        return techniciansApi.update(technician.id, {
          name: values.name,
          email: values.email,
          ...(values.password ? { password: values.password } : {}),
          department: values.department || undefined,
          contactPhone: values.contactPhone || undefined,
          specializations: values.specializations,
          skills,
          availability: values.availability,
        });
      }

      return techniciansApi.create({
        name: values.name,
        email: values.email,
        password: values.password ?? '',
        department: values.department || undefined,
        contactPhone: values.contactPhone || undefined,
        specializations: values.specializations,
        skills,
        availability: values.availability,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success(isEditing ? 'Technician updated' : 'Technician added');
      onOpenChange(false);
    },
    onError: (error) => {
      setServerError(
        error instanceof ApiError ? error.message : 'Unable to save technician',
      );
    },
  });

  const onSubmit = (values: TechnicianFormValues) => {
    setServerError(null);
    saveMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update technician contact details, specializations, and availability.'
              : 'Create a new technician account with assigned maintenance specializations.'}
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tech-name" label="Full Name" error={errors.name?.message} required>
              <Input
                id="tech-name"
                {...register('name')}
                placeholder="e.g. Alex Rivera"
                autoComplete="name"
              />
            </FormField>

            <FormField id="tech-email" label="Email Address" error={errors.email?.message} required>
              <Input
                id="tech-email"
                {...register('email')}
                type="email"
                placeholder="alex.rivera@campus.edu"
                autoComplete="email"
              />
            </FormField>
          </div>

          <FormField
            id="tech-password"
            label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            error={errors.password?.message}
            required={!isEditing}
          >
            <PasswordInput
              id="tech-password"
              {...register('password')}
              placeholder={isEditing ? '••••••••' : 'At least 8 characters'}
              autoComplete={isEditing ? 'new-password' : 'current-password'}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tech-department" label="Department" error={errors.department?.message}>
              <Input id="tech-department" {...register('department')} placeholder="Facilities / IT" />
            </FormField>

            <FormField id="tech-phone" label="Contact Phone" error={errors.contactPhone?.message}>
              <Input id="tech-phone" {...register('contactPhone')} placeholder="+1 555-0142" />
            </FormField>
          </div>

          <FormField id="tech-availability" label="Availability" error={errors.availability?.message} required>
            <select
              id="tech-availability"
              {...register('availability')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </FormField>

          <FormField
            id="tech-specializations"
            label="Specializations"
            hint="Select categories this technician specializes in. These match first in the assign picker."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MAINTENANCE_CATEGORIES.map((category) => {
                const checked = (selectedSpecializations ?? []).includes(category);
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => toggleSpecialization(category)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-colors text-left ${
                      checked
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="truncate">{category}</span>
                    {checked && <span className="text-primary font-bold ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField
            id="tech-skills"
            label="Additional Skills (comma-separated)"
            hint="Specific certifications or equipment experience"
            error={errors.skillsText?.message}
          >
            <Input
              id="tech-skills"
              {...register('skillsText')}
              placeholder="HVAC Certified, Cisco CCNA, High Voltage"
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Technician'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
