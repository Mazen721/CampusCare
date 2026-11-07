import { z } from 'zod';
import { LOST_FOUND_CATEGORIES, REPORT_TYPES } from '@/types/lostFound';

export const reportItemSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  itemTitle: z
    .string()
    .trim()
    .min(3, 'Item title must be at least 3 characters')
    .max(160, 'Item title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the item in at least 10 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  privateIdentificationDetails: z
    .string()
    .trim()
    .min(3, 'Add at least one private identifying detail')
    .max(4000, 'Private details must be 4000 characters or fewer'),
  category: z.enum(LOST_FOUND_CATEGORIES),
  color: z.string().trim().max(60, 'Colour must be 60 characters or fewer'),
  brand: z.string().trim().max(80, 'Brand must be 80 characters or fewer'),
  locationId: z.string().min(1, 'Select a campus location'),
  locationDetails: z
    .string()
    .trim()
    .min(2, 'Add a short location description')
    .max(500, 'Location details must be 500 characters or fewer'),
  occurrenceDate: z.string().min(1, 'Choose the date the item was lost or found'),
});

export type ReportItemValues = z.infer<typeof reportItemSchema>;
