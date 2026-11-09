import { z } from 'zod';
import {
  MAINTENANCE_CATEGORIES,
  TECHNICIAN_AVAILABILITIES,
} from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const listTechniciansQuerySchema = z.object({
  category: z.enum(MAINTENANCE_CATEGORIES).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const technicianIdSchema = z.object({
  id: objectId,
});

export const createTechnicianSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().trim().max(254),
  password: z.string().min(8).max(128),
  department: z.string().trim().max(120).optional(),
  departmentAr: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  specializations: z.array(z.enum(MAINTENANCE_CATEGORIES)).default([]),
  skills: z.array(z.string().trim().min(1).max(80)).default([]),
  availability: z.enum(TECHNICIAN_AVAILABILITIES).default('AVAILABLE'),
  isActive: z.boolean().default(true),
});

export const updateTechnicianSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().trim().max(254).optional(),
  password: z.string().min(8).max(128).optional(),
  department: z.string().trim().max(120).optional(),
  departmentAr: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  specializations: z.array(z.enum(MAINTENANCE_CATEGORIES)).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).optional(),
  availability: z.enum(TECHNICIAN_AVAILABILITIES).optional(),
  isActive: z.boolean().optional(),
});

export type ListTechniciansQuery = z.infer<typeof listTechniciansQuerySchema>;
export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;
