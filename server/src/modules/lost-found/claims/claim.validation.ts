import { z } from 'zod';
import { CLAIM_STATUSES } from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Id is not valid');

const optionalObjectId = z.preprocess(
  (value) => (value === '' ? undefined : value),
  objectId.optional(),
);

export const createClaimSchema = z.object({
  itemId: objectId,
  claimDescription: z
    .string()
    .trim()
    .min(10, 'Describe your claim in at least 10 characters')
    .max(4000, 'Claim description must be 4000 characters or fewer'),
  identifyingDetailsProvided: z
    .string()
    .trim()
    .min(3, 'Add at least one identifying detail')
    .max(4000, 'Identifying details must be 4000 characters or fewer'),
  linkedLostItemId: optionalObjectId,
});

export const listClaimsQuerySchema = z.object({
  status: z.enum(CLAIM_STATUSES).optional(),
  itemId: objectId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const claimIdSchema = z.object({
  id: objectId,
});

export const reviewClaimSchema = z
  .object({
    action: z.enum(['START_VERIFICATION', 'APPROVE', 'REJECT']),
    notes: z
      .string()
      .trim()
      .max(4000, 'Notes must be 4000 characters or fewer')
      .optional(),
    rejectionReason: z
      .string()
      .trim()
      .max(1000, 'Rejection reason must be 1000 characters or fewer')
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'REJECT') {
      const reason = value.rejectionReason || value.notes;
      if (!reason || reason.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rejectionReason'],
          message: 'A rejection reason of at least 3 characters is required',
        });
      }
    }
  });

export const handoverClaimSchema = z.object({
  receivedByName: z
    .string()
    .trim()
    .min(2, 'Enter who received the item')
    .max(120, 'Received by must be 120 characters or fewer'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Handover notes must be 1000 characters or fewer')
    .optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type ListClaimsQuery = z.infer<typeof listClaimsQuerySchema>;
export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
export type HandoverClaimInput = z.infer<typeof handoverClaimSchema>;
