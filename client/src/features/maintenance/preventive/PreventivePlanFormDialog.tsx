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
import { formatLocation } from '@/i18n/localize';
import { getErrorMessage } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '@/lib/labels';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  type MaintenanceCategory,
  type Priority,
} from '@/types/meta';
import {
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
    titleAr: z
      .string()
      .trim()
      .max(160, 'Title (Arabic) must be 160 characters or fewer')
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, 'Describe the plan in at least 10 characters')
      .max(4000, 'Description must be 4000 characters or fewer'),
    descriptionAr: z
      .string()
      .trim()
      .max(4000, 'Description (Arabic) must be 4000 characters or fewer')
      .optional(),
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
        titleAr: plan.titleAr ?? '',
        description: plan.description,
        descriptionAr: plan.descriptionAr ?? '',
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
        titleAr: '',
        description: '',
        descriptionAr: '',
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
  const { t } = useTranslation();
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
        titleAr: values.titleAr?.trim() || undefined,
        description: values.description,
        descriptionAr: values.descriptionAr?.trim() || undefined,
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
          <DialogTitle>{isEditing ? t('preventive.editPlan') : t('preventive.createPlan')}</DialogTitle>
          <DialogDescription>
            {t('preventive.manualNotice')}
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
            <FormField id="plan-title" label={t('preventive.planTitleEn')} error={errors.title?.message} required>
              <Input id="plan-title" dir="ltr" placeholder={t('preventive.titlePlaceholder')} {...register('title')} />
            </FormField>

            <FormField id="plan-title-ar" label={t('preventive.planTitleAr')} error={errors.titleAr?.message}>
              <Input id="plan-title-ar" dir="rtl" placeholder="فحص فلاتر التكييف الأسبوعي" {...register('titleAr')} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="plan-description"
              label={t('preventive.descriptionEn')}
              error={errors.description?.message}
              required
            >
              <Textarea
                id="plan-description"
                dir="ltr"
                rows={3}
                placeholder={t('preventive.descPlaceholder')}
                {...register('description')}
              />
            </FormField>

            <FormField
              id="plan-description-ar"
              label={t('preventive.descriptionAr')}
              error={errors.descriptionAr?.message}
            >
              <Textarea
                id="plan-description-ar"
                dir="rtl"
                rows={3}
                placeholder="ما الذي يجب على الفني فحصه أو تنظيفه أو استبداله؟"
                {...register('descriptionAr')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="plan-category" label={t('preventive.category')} error={errors.category?.message} required>
              <select
                id="plan-category"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('category')}
              >
                {MAINTENANCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {enumLabel('maintenanceCategory', category)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="plan-priority" label={t('preventive.priority')} error={errors.priority?.message} required>
              <select
                id="plan-priority"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('priority')}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {enumLabel('priority', priority)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-location"
              label={t('preventive.location')}
              error={errors.locationId?.message}
              required
            >
              <select
                id="plan-location"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('locationId')}
              >
                <option value="">{t('preventive.selectLocationPlaceholder')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {formatLocation(location)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-technician"
              label={t('preventive.assignedTechnician')}
              error={errors.assignedTechnicianId?.message}
              hint={t('preventive.assignedTechnicianHint')}
            >
              <select
                id="plan-technician"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('assignedTechnicianId')}
              >
                <option value="">{t('preventive.unassigned')}</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="plan-recurrence"
              label={t('preventive.recurrence')}
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
                    {enumLabel('recurrence', type)}
                  </option>
                ))}
              </select>
            </FormField>

            {recurrenceType === 'CUSTOM_DAYS' ? (
              <FormField
                id="plan-interval"
                label={t('preventive.customInterval')}
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
              label={t('preventive.firstOccurrence')}
              error={errors.startDate?.message}
              required
            >
              <Input id="plan-start-date" type="date" {...register('startDate')} />
            </FormField>

            <FormField
              id="plan-duration"
              label={t('preventive.expectedDuration')}
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
            {t('preventive.planIsActive')}
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? t('common.save') : t('preventive.createPlan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
