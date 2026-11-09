import { z } from 'zod';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  RECURRENCE_TYPES,
} from '../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid reference');

const booleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

const planFields = {
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or fewer'),
  titleAr: z
    .string()
    .trim()
    .max(160, 'Title (Arabic) must be 160 characters or fewer')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the plan in at least 10 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  descriptionAr: z
    .string()
    .trim()
    .max(4000, 'Description (Arabic) must be 4000 characters or fewer')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  category: z.enum(MAINTENANCE_CATEGORIES),
  priority: z.enum(PRIORITIES),
  locationId: objectId,
  assignedTechnicianId: objectId.optional(),
  recurrenceType: z.enum(RECURRENCE_TYPES),
  recurrenceIntervalDays: z.coerce
    .number()
    .int()
    .min(1, 'The custom interval must be at least 1 day')
    .max(365, 'The custom interval must be 365 days or fewer')
    .optional(),
  startDate: z.coerce.date(),
  expectedDurationHours: z.coerce
    .number()
    .min(0.25, 'Expected duration must be at least 15 minutes')
    .max(720, 'Expected duration must be 720 hours or fewer'),
  isActive: z.boolean().optional(),
};

function requireCustomInterval(
  value: { recurrenceType: string; recurrenceIntervalDays?: number },
  context: z.RefinementCtx,
): void {
  if (value.recurrenceType === 'CUSTOM_DAYS' && !value.recurrenceIntervalDays) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['recurrenceIntervalDays'],
      message: 'recurrenceIntervalDays is required when recurrenceType is CUSTOM_DAYS',
    });
  }
}

export const createPreventivePlanSchema = z
  .object(planFields)
  .superRefine(requireCustomInterval);

export const updatePreventivePlanSchema = z
  .object(planFields)
  .partial()
  .extend({
    assignedTechnicianId: objectId.nullable().optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      });
    }

    if (
      value.recurrenceType === 'CUSTOM_DAYS' &&
      value.recurrenceIntervalDays === undefined
    ) {
      // The existing plan may already carry an interval; the service validates
      // the effective rule after merging.
      return;
    }
  });

export const updatePreventivePlanStatusSchema = z.object({
  isActive: z.boolean(),
});

export const preventivePlanIdSchema = z.object({
  id: objectId,
});

export const listPreventivePlansQuerySchema = z.object({
  isActive: booleanQuery,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreatePreventivePlanInput = z.infer<typeof createPreventivePlanSchema>;
export type UpdatePreventivePlanInput = z.infer<typeof updatePreventivePlanSchema>;
export type UpdatePreventivePlanStatusInput = z.infer<
  typeof updatePreventivePlanStatusSchema
>;
export type ListPreventivePlansQuery = z.infer<
  typeof listPreventivePlansQuerySchema
>;
