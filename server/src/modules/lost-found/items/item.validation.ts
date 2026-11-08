import { z } from 'zod';
import {
  ITEM_STATUSES,
  LOST_FOUND_CATEGORIES,
  REPORT_TYPES,
} from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid campus location');

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

const editableFields = {
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
  color: optionalText(60, 'Colour'),
  brand: optionalText(80, 'Brand'),
  locationId: objectId,
  locationDetails: z
    .string()
    .trim()
    .min(2, 'Add a short location description')
    .max(500, 'Location details must be 500 characters or fewer'),
  occurrenceDate: z.coerce.date({
    errorMap: () => ({ message: 'Enter a valid date' }),
  }),
};

export const createItemSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  ...editableFields,
});

export const listItemsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: z.enum(LOST_FOUND_CATEGORIES).optional(),
    reportType: z.enum(REPORT_TYPES).optional(),
    locationId: objectId.optional(),
    building: z.string().trim().max(120).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    color: z.string().trim().max(60).optional(),
    brand: z.string().trim().max(80).optional(),
    status: z.enum(ITEM_STATUSES).optional(),
    scope: z.enum(['active', 'archived', 'all']).optional(),
    mine: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'The date range end must be after its start',
    path: ['to'],
  });

export const updateItemSchema = z
  .object({
    itemTitle: editableFields.itemTitle.optional(),
    description: editableFields.description.optional(),
    privateIdentificationDetails:
      editableFields.privateIdentificationDetails.optional(),
    category: editableFields.category.optional(),
    color: optionalText(60, 'Colour'),
    brand: optionalText(80, 'Brand'),
    locationId: objectId.optional(),
    locationDetails: editableFields.locationDetails.optional(),
    occurrenceDate: z.coerce.date().optional(),
    status: z.literal('CLOSED').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one change',
  });

export const itemIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Item id is not valid'),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
