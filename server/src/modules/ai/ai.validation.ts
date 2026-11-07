import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Work order id is not valid');

export const workOrderSummaryBodySchema = z.object({
  workOrderId: objectId,
});

/** The generated summary must be non-empty and under 300 characters. */
export const summaryTextSchema = z
  .string()
  .trim()
  .min(1, 'AI summary cannot be empty')
  .max(299, 'AI summary must be under 300 characters');

export type WorkOrderSummaryBody = z.infer<typeof workOrderSummaryBodySchema>;
