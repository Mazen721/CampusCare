import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Actor id is not valid');

export const listActivityLogsQuerySchema = z
  .object({
    entityType: z.string().trim().min(1).max(60).optional(),
    actorId: objectId.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'The date range end must be after its start',
    path: ['to'],
  });

export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;
