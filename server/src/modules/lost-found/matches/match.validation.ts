import { z } from 'zod';
import { MATCH_STATUSES } from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Id is not valid');

export const listMatchesQuerySchema = z.object({
  status: z.enum(MATCH_STATUSES).optional(),
  itemId: objectId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const matchIdSchema = z.object({
  id: objectId,
});

export const reviewMatchSchema = z.object({
  action: z.enum(['CONFIRM', 'DISMISS']),
});

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type ReviewMatchInput = z.infer<typeof reviewMatchSchema>;
