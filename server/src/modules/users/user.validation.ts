import { z } from 'zod';
import {
  MAINTENANCE_CATEGORIES,
  ROLES,
  TECHNICIAN_AVAILABILITIES,
} from '../../config/constants';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

const name = z.string().trim().min(2, 'Name is required').max(120);

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

const technicianFields = {
  specializations: z.array(z.enum(MAINTENANCE_CATEGORIES)).max(9).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  availability: z.enum(TECHNICIAN_AVAILABILITIES).optional(),
};

export const createUserSchema = z.object({
  name,
  email,
  password,
  role: z.enum(ROLES),
  department: optionalText(120),
  departmentAr: optionalText(120),
  contactPhone: optionalText(40),
  ...technicianFields,
});

export const updateUserSchema = z
  .object({
    name,
    email,
    role: z.enum(ROLES),
    department: optionalText(120),
    departmentAr: optionalText(120),
    contactPhone: optionalText(40),
    ...technicianFields,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'User id is not valid'),
});

const booleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(ROLES).optional(),
  isActive: booleanQuery,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
