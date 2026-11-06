import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import {
  createTechnician,
  getTechnician,
  listTechnicians,
  updateTechnician,
} from './technician.controller';
import {
  createTechnicianSchema,
  listTechniciansQuerySchema,
  technicianIdSchema,
  updateTechnicianSchema,
} from './technician.validation';

export const technicianRouter = Router();

technicianRouter.use(authenticate);
technicianRouter.use(authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN'));

technicianRouter.get(
  '/',
  validate(listTechniciansQuerySchema, 'query'),
  listTechnicians,
);

technicianRouter.get(
  '/:id',
  validate(technicianIdSchema, 'params'),
  getTechnician,
);

technicianRouter.post(
  '/',
  validate(createTechnicianSchema),
  createTechnician,
);

technicianRouter.patch(
  '/:id',
  validate(technicianIdSchema, 'params'),
  validate(updateTechnicianSchema),
  updateTechnician,
);
