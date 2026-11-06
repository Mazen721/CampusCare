import { z } from 'zod';
import { LOCATION_TYPES } from '../../config/constants';

const locationFields = {
  buildingName: z.string().trim().min(1, 'Building name is required').max(120),
  floor: z.string().trim().min(1, 'Floor is required').max(40),
  room: z.string().trim().min(1, 'Room is required').max(40),
  locationType: z.enum(LOCATION_TYPES),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
};

export const createLocationSchema = z.object(locationFields);

export const updateLocationSchema = z
  .object(locationFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const locationIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Location id is not valid'),
});

const booleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const listLocationsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  includeInactive: booleanQuery,
  isActive: booleanQuery,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type ListLocationsQuery = z.infer<typeof listLocationsQuerySchema>;
