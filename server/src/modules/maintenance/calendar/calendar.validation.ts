import { z } from 'zod';
import { WORK_ORDER_STATUSES } from '../../../config/constants';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Technician id is not valid');

export const calendarQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    technicianId: objectId.optional(),
    status: z.enum(WORK_ORDER_STATUSES).optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'The calendar range end must be after its start',
    path: ['to'],
  });

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
