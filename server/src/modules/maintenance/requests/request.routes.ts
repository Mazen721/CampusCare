import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import { uploadRequestImages } from '../../../shared/middleware/upload';
import {
  createRequest,
  getRequest,
  listRequests,
  reviewRequest,
} from './request.controller';
import {
  createRequestSchema,
  listRequestsQuerySchema,
  requestIdSchema,
  reviewRequestSchema,
} from './request.validation';

export const maintenanceRequestRouter = Router();

maintenanceRequestRouter.use(authenticate);

maintenanceRequestRouter.post(
  '/',
  authorizeRoles('STUDENT_EMPLOYEE'),
  uploadRequestImages,
  validate(createRequestSchema),
  createRequest,
);

maintenanceRequestRouter.get(
  '/',
  authorizeRoles('STUDENT_EMPLOYEE', 'MAINTENANCE_MANAGER', 'SUPER_ADMIN'),
  validate(listRequestsQuerySchema, 'query'),
  listRequests,
);

maintenanceRequestRouter.get(
  '/:id',
  authorizeRoles(
    'STUDENT_EMPLOYEE',
    'MAINTENANCE_MANAGER',
    'SUPER_ADMIN',
    'TECHNICIAN',
  ),
  validate(requestIdSchema, 'params'),
  getRequest,
);

maintenanceRequestRouter.patch(
  '/:id/review',
  authorizeRoles('MAINTENANCE_MANAGER'),
  validate(requestIdSchema, 'params'),
  validate(reviewRequestSchema),
  reviewRequest,
);
