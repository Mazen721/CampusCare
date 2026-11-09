import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { locationsApi } from '@/features/locations/locationsApi';
import { preventiveApi } from '@/features/maintenance/preventive/preventiveApi';
import { techniciansApi } from '@/features/maintenance/technicians/techniciansApi';
import { getErrorMessage } from '@/lib/api';
import { humanizeEnum } from '@/lib/labels';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  type MaintenanceCategory,
  type Priority,
} from '@/types/meta';
import {
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  type PreventivePlanRecord,
  type RecurrenceType,
} from '@/types/preventive';

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

const planSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(160, 'Title must be 160 characters or fewer'),
    description: z
      .string()
      .trim()
      .min(10, 'Describe the plan in at least 10 characters')
      .max(4000, 'Description must be 4000 characters or fewer'),
    category: z.enum(MAINTENANCE_CATEGORIES),
    priority: z.enum(PRIORITIES),
    locationId: z.string().min(1, 'Select an active location'),
    assignedTechnicianId: z.string().optional(),
    recurrenceType: z.enum(RECURRENCE_TYPES),
    recurrenceIntervalDays: z.string().trim().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    expectedDurationHours: z
      .string()
      .trim()
      .min(1, 'Expected duration is required')
      .refine((value) => {
        const hours = Number(value);
        return Number.isFinite(hours) && hours >= 0.25 && hours <= 720;
      }, 'Duration must be between 0.25 and 720 hours'),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.recurrenceType !== 'CUSTOM_DAYS') return;
    const days = Number(values.recurrenceIntervalDays);
    if (!values.recurrenceIntervalDays || !Number.isInteger(days) || days < 1 || days > 365) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrenceIntervalDays'],
        message: 'Enter an interval between 1 and 365 days',
      });
    }
  });

type PlanFormValues = z.infer<typeof planSchema>;

function buildDefaultValues(plan?: PreventivePlanRecord | null): PlanFormValues {
  return plan
    ? {
        title: plan.title,
        description: plan.description,
        category: plan.category,
        priority: plan.priority,
        locationId: plan.location?.id ?? '',
        assignedTechnicianId: plan.assignedTechnician?.id ?? '',
        recurrenceType: plan.recurrenceType,
        recurrenceIntervalDays: plan.recurrenceIntervalDays?.toString() ?? '',
        startDate: plan.startDate.slice(0, 10),
        expectedDurationHours: String(plan.expectedDurationHours),
        isActive: plan.isActive,
      }
    : {
        title: '',
        description: '',
        category: 'General Maintenance',
        priority: 'MEDIUM',
        locationId: '',
        assignedTechnicianId: '',
        recurrenceType: 'WEEKLY',
        recurrenceIntervalDays: '',
        startDate: todayInput(),
        expectedDurationHours: '2',
        isActive: true,
      };
}

interface PreventivePlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PreventivePlanRecord | null;
}

export function PreventivePlanFormDialog({
  open,
  onOpenChange,
  plan,
}: PreventivePlanFormDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(plan);

  const locationsQuery = useQuery({
    queryKey: ['locations', { preventivePicker: true }],
    queryFn: () => locationsApi.list({ isActive: true, limit: 100 }),
    enabled: open,
  });

  const techniciansQuery = useQuery({
    queryKey: ['technicians', { preventivePicker: true }],
    queryFn: () => techniciansApi.list({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: buildDefaultValues(plan),
  });

  const recurrenceType = watch('recurrenceType');

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset(buildDefaultValues(plan));
  }, [open, plan, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: PlanFormValues) => {
      const interval = values.recurrenceIntervalDays
        ? Number(values.recurrenceIntervalDays)
        : undefined;
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category as MaintenanceCategory,
        priority: values.priority as Priority,
        locationId: values.locationId,
        assignedTechnicianId: values.assignedTechnicianId || undefined,
        recurrenceType: values.recurrenceType as RecurrenceType,
        recurrenceIntervalDays:
          values.recurrenceType === 'CUSTOM_DAYS' ? interval : undefined,
        startDate: values.startDate,
        expectedDurationHours: Number(values.expectedDurationHours),
        isActive: values.isActive,
      };

      return isEditing && plan
        ? preventiveApi.update(plan.id, {
            ...payload,
            assignedTechnicianId: values.assignedTechnicianId || null,
          })
        : preventiveApi.create(payload);
    },
  });

  const onSubmit = async (values: PlanFormValues) => {
    setServerError(null);
    try {
      await saveMutation.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['preventive-plans'] });
      toast.success(isEditing ? 'Preventive plan updated' : 'Preventive plan created');
      onOpenChange(false);
    } catch (error) {
      setServerError(
        getErrorMessage(error),
      );
    }
  };

  const locations = locationsQuery.data?.data ?? [];
  const technicians = techniciansQuery.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit preventive plan' : 'New preventive plan'}</DialogTitle>
          <DialogDescription>
            Plans do not generate work orders automatically. A manager runs Generate due work
            orders when needed.
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

          <FormField id="plan-title" label="Title" error={errors.title?.message} required>
            <Input id="plan-title" placeholder="Weekly HVAC filter inspection" {...register('title')} />
          </FormField>

          <FormField
            id="plan-description"
            label="Description"
            error={errors.description?.message}
            required
          >
            <Textarea
              id="plan-description"
              rows={3}
              placeholder="What should the technician inspect, clean or replace?"
              {...register('description')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="plan-category" label="Category" error={errors.category?.message} required>
              <select
                id="plan-category"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('category')}
              >
                {MAINTENANCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="plan-priority" label="Priority" error={errors.priority?.message} required>
              <select
                id="plan-priority"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('priority')}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanizeEnum(priority)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-location"
              label="Location"
              error={errors.locationId?.message}
              required
            >
              <select
                id="plan-location"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('locationId')}
              >
                <option value="">Select a location…</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.buildingName} · {location.floor} · {location.room}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-technician"
              label="Assigned technician"
              error={errors.assignedTechnicianId?.message}
              hint="Optional. Without a technician, generated work orders stay pending assignment."
            >
              <select
                id="plan-technician"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('assignedTechnicianId')}
              >
                <option value="">Unassigned</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-recurrence"
              label="Recurrence"
              error={errors.recurrenceType?.message}
              required
            >
              <select
                id="plan-recurrence"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('recurrenceType')}
              >
                {RECURRENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {RECURRENCE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FormField>

            {recurrenceType === 'CUSTOM_DAYS' ? (
              <FormField
                id="plan-interval"
                label="Custom interval (days)"
                error={errors.recurrenceIntervalDays?.message}
                required
              >
                <Input
                  id="plan-interval"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  {...register('recurrenceIntervalDays')}
                />
              </FormField>
            ) : null}

            <FormField
              id="plan-start-date"
              label="First occurrence"
              error={errors.startDate?.message}
              required
            >
              <Input id="plan-start-date" type="date" {...register('startDate')} />
            </FormField>

            <FormField
              id="plan-duration"
              label="Expected duration (hours)"
              error={errors.expectedDurationHours?.message}
              required
            >
              <Input
                id="plan-duration"
                type="number"
                min={0.25}
                max={720}
                step={0.25}
                {...register('expectedDurationHours')}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('isActive')}
            />
            Plan is active
          </label>

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
              {isEditing ? 'Save changes' : 'Create plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
