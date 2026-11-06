import { z } from 'zod';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  REQUEST_STATUSES,
} from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid location');

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the issue in at least 10 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  category: z.enum(MAINTENANCE_CATEGORIES),
  priority: z.enum(PRIORITIES),
  locationId: objectId,
  equipmentDescription: z
    .string()
    .trim()
    .max(1000, 'Equipment description must be 1000 characters or fewer')
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

export const listRequestsQuerySchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(MAINTENANCE_CATEGORIES).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const reviewRequestSchema = z
  .object({
    action: z.enum(['UNDER_REVIEW', 'APPROVE', 'REJECT']),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes must be 2000 characters or fewer')
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
  })
  .superRefine((value, context) => {
    if (value.action === 'REJECT' && !value.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'Review notes are required when rejecting a request',
      });
    }
  });

export const requestIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Request id is not valid'),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
