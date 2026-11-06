import { z } from 'zod';

const booleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const listNotificationsQuerySchema = z.object({
  unreadOnly: booleanQuery,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Notification id is not valid'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
