import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.controller';
import {
  listNotificationsQuerySchema,
  notificationIdSchema,
} from './notification.validation';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  listNotifications,
);
notificationRouter.patch('/read-all', markAllNotificationsRead);
notificationRouter.patch(
  '/:id/read',
  validate(notificationIdSchema, 'params'),
  markNotificationRead,
);
