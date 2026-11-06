import { z } from 'zod';
import {
  SOURCE_TYPES,
  WORK_ORDER_STATUSES,
} from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const listWorkOrdersQuerySchema = z.object({
  status: z.enum(WORK_ORDER_STATUSES).optional(),
  technicianId: objectId.optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const workOrderIdSchema = z.object({
  id: objectId,
});

export const assignWorkOrderSchema = z
  .object({
    technicianId: objectId,
    scheduledStart: z.coerce.date(),
    expectedCompletion: z.coerce.date(),
  })
  .refine((data) => data.expectedCompletion > data.scheduledStart, {
    message: 'Expected completion date must be after scheduled start date',
    path: ['expectedCompletion'],
  });

export const addNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Note cannot be empty')
    .max(2000, 'Note must be 2000 characters or fewer'),
});

export const completeWorkOrderSchema = z.object({
  resolutionDetails: z
    .string()
    .trim()
    .min(5, 'Resolution details must be at least 5 characters')
    .max(4000, 'Resolution details must be 4000 characters or fewer'),
});

export const cancelWorkOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Cancel reason must be at least 3 characters')
    .max(1000, 'Cancel reason must be 1000 characters or fewer'),
});

export type ListWorkOrdersQuery = z.infer<typeof listWorkOrdersQuerySchema>;
export type AssignWorkOrderInput = z.infer<typeof assignWorkOrderSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
export type CancelWorkOrderInput = z.infer<typeof cancelWorkOrderSchema>;
