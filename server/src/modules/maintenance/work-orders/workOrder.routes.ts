import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import {
  addNote,
  assignWorkOrder,
  cancelWorkOrder,
  completeWorkOrder,
  getWorkOrder,
  listWorkOrders,
  startWorkOrder,
} from './workOrder.controller';
import {
  addNoteSchema,
  assignWorkOrderSchema,
  cancelWorkOrderSchema,
  completeWorkOrderSchema,
  listWorkOrdersQuerySchema,
  workOrderIdSchema,
} from './workOrder.validation';

export const workOrderRouter = Router();

workOrderRouter.use(authenticate);

workOrderRouter.get(
  '/',
  authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'TECHNICIAN'),
  validate(listWorkOrdersQuerySchema, 'query'),
  listWorkOrders,
);

workOrderRouter.get(
  '/:id',
  authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'TECHNICIAN'),
  validate(workOrderIdSchema, 'params'),
  getWorkOrder,
);

workOrderRouter.patch(
  '/:id/assign',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(workOrderIdSchema, 'params'),
  validate(assignWorkOrderSchema),
  assignWorkOrder,
);

workOrderRouter.patch(
  '/:id/start',
  authorizeRoles('TECHNICIAN'),
  validate(workOrderIdSchema, 'params'),
  startWorkOrder,
);

workOrderRouter.post(
  '/:id/notes',
  authorizeRoles('TECHNICIAN', 'MAINTENANCE_MANAGER'),
  validate(workOrderIdSchema, 'params'),
  validate(addNoteSchema),
  addNote,
);

workOrderRouter.patch(
  '/:id/complete',
  authorizeRoles('TECHNICIAN'),
  validate(workOrderIdSchema, 'params'),
  validate(completeWorkOrderSchema),
  completeWorkOrder,
);

workOrderRouter.patch(
  '/:id/cancel',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(workOrderIdSchema, 'params'),
  validate(cancelWorkOrderSchema),
  cancelWorkOrder,
);
