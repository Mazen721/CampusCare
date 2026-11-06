import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createFeedbackSchema = z.object({
  maintenanceRequestId: objectId,
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .trim()
    .max(500, 'Comment must be 500 characters or fewer')
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

export const listFeedbackQuerySchema = z.object({
  technicianId: objectId.optional(),
  maintenanceRequestId: objectId.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;
