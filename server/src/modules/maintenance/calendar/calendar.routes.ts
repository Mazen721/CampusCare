import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import { getCalendar } from './calendar.controller';
import { calendarQuerySchema } from './calendar.validation';

export const calendarRouter = Router();

calendarRouter.use(authenticate);

calendarRouter.get(
  '/',
  authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'TECHNICIAN'),
  validate(calendarQuerySchema, 'query'),
  getCalendar,
);
