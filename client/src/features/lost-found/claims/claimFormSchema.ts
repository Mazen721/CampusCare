import { z } from 'zod';

export const claimFormSchema = z.object({
  itemId: z.string().min(1, 'Select the found item you are claiming'),
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
  linkedLostItemId: z.string().optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;
