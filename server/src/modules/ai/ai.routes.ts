import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorizeRoles } from '../../shared/middleware/authorizeRoles';
import { validate } from '../../shared/middleware/validate';
import {
  generateMaintenanceInsights,
  summarizeWorkOrder,
} from './ai.controller';
import {
  maintenanceInsightsBodySchema,
  workOrderSummaryBodySchema,
} from './ai.validation';

export const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post(
  '/work-order-summary',
  authorizeRoles('TECHNICIAN', 'MAINTENANCE_MANAGER'),
  validate(workOrderSummaryBodySchema),
  summarizeWorkOrder,
);

aiRouter.post(
  '/maintenance-insights',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(maintenanceInsightsBodySchema),
  generateMaintenanceInsights,
);
