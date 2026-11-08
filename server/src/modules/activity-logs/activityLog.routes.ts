import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorizeRoles } from '../../shared/middleware/authorizeRoles';
import { validate } from '../../shared/middleware/validate';
import { listActivityLogs } from './activityLog.controller';
import { listActivityLogsQuerySchema } from './activityLog.validation';

export const activityLogRouter = Router();

activityLogRouter.use(authenticate, authorizeRoles('SUPER_ADMIN'));

activityLogRouter.get(
  '/',
  validate(listActivityLogsQuerySchema, 'query'),
  listActivityLogs,
);
