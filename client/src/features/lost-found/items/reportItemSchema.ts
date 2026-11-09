import type { TFunction } from 'i18next';
import { z } from 'zod';
import i18n from '@/i18n';
import { LOST_FOUND_CATEGORIES, REPORT_TYPES } from '@/types/lostFound';

export function createReportItemSchema(t: TFunction) {
  return z.object({
    reportType: z.enum(REPORT_TYPES),
    itemTitle: z
      .string()
      .trim()
      .min(3, t('validation.minChars', { field: t('lostFound.itemTitle'), min: 3 }))
      .max(160, t('validation.maxChars', { field: t('lostFound.itemTitle'), max: 160 })),
    description: z
      .string()
      .trim()
      .min(10, t('validation.min10Chars'))
      .max(4000, t('validation.maxChars', { field: t('lostFound.description'), max: 4000 })),
    privateIdentificationDetails: z
      .string()
      .trim()
      .min(3, t('validation.minChars', { field: t('lostFound.privateDetails'), min: 3 }))
      .max(4000, t('validation.maxChars', { field: t('lostFound.privateDetails'), max: 4000 })),
    category: z.enum(LOST_FOUND_CATEGORIES),
    color: z.string().trim().max(60, t('validation.maxChars', { field: t('lostFound.color'), max: 60 })),
    brand: z.string().trim().max(80, t('validation.maxChars', { field: t('lostFound.brand'), max: 80 })),
    locationId: z.string().min(1, t('validation.locationRequired')),
    locationDetails: z
      .string()
      .trim()
      .min(2, t('validation.minChars', { field: t('lostFound.locationDetails'), min: 2 }))
      .max(500, t('validation.maxChars', { field: t('lostFound.locationDetails'), max: 500 })),
    occurrenceDate: z.string().min(1, t('validation.dateRequired')),
  });
}

export const reportItemSchema = createReportItemSchema(i18n.t);
export type ReportItemSchema = ReturnType<typeof createReportItemSchema>;
export type ReportItemValues = z.infer<ReportItemSchema>;
