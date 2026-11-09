import type { TFunction } from 'i18next';
import { z } from 'zod';
import i18n from '@/i18n';

export function createClaimFormSchema(t: TFunction) {
  return z.object({
    itemId: z.string().min(1, t('validation.claimFoundItemRequired')),
    claimDescription: z
      .string()
      .trim()
      .min(10, t('validation.min10Chars'))
      .max(4000, t('validation.maxChars', { field: t('claims.claimDescription'), max: 4000 })),
    identifyingDetailsProvided: z
      .string()
      .trim()
      .min(3, t('validation.min3Chars'))
      .max(4000, t('validation.maxChars', { field: t('claims.identifyingDetails'), max: 4000 })),
    linkedLostItemId: z.string().optional(),
  });
}

export const claimFormSchema = createClaimFormSchema(i18n.t);
export type ClaimFormSchema = ReturnType<typeof createClaimFormSchema>;
export type ClaimFormValues = z.infer<ClaimFormSchema>;
