import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorizeRoles } from '../../shared/middleware/authorizeRoles';
import { validate } from '../../shared/middleware/validate';
import {
  createPreventivePlan,
  generateDueWorkOrders,
  listPreventivePlans,
  updatePreventivePlan,
  updatePreventivePlanStatus,
} from './preventive.controller';
import {
  createPreventivePlanSchema,
  listPreventivePlansQuerySchema,
  preventivePlanIdSchema,
  updatePreventivePlanSchema,
  updatePreventivePlanStatusSchema,
} from './preventive.validation';

export const preventiveRouter = Router();

preventiveRouter.use(authenticate);

preventiveRouter.get(
  '/',
  authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN'),
  validate(listPreventivePlansQuerySchema, 'query'),
  listPreventivePlans,
);

preventiveRouter.post(
  '/',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(createPreventivePlanSchema),
  createPreventivePlan,
);

preventiveRouter.post(
  '/generate-due',
  authorizeRoles('MAINTENANCE_MANAGER'),
  generateDueWorkOrders,
);

preventiveRouter.patch(
  '/:id',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(preventivePlanIdSchema, 'params'),
  validate(updatePreventivePlanSchema),
  updatePreventivePlan,
);

preventiveRouter.patch(
  '/:id/status',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(preventivePlanIdSchema, 'params'),
  validate(updatePreventivePlanStatusSchema),
  updatePreventivePlanStatus,
);
