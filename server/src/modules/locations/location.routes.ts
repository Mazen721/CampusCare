import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorizeRoles } from '../../shared/middleware/authorizeRoles';
import { validate } from '../../shared/middleware/validate';
import {
  createLocation,
  deactivateLocation,
  listLocations,
  updateLocation,
} from './location.controller';
import {
  createLocationSchema,
  listLocationsQuerySchema,
  locationIdSchema,
  updateLocationSchema,
} from './location.validation';

export const locationRouter = Router();

locationRouter.use(authenticate);

locationRouter.get('/', validate(listLocationsQuerySchema, 'query'), listLocations);

locationRouter.post(
  '/',
  authorizeRoles('SUPER_ADMIN'),
  validate(createLocationSchema),
  createLocation,
);

locationRouter.patch(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  validate(locationIdSchema, 'params'),
  validate(updateLocationSchema),
  updateLocation,
);

locationRouter.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  validate(locationIdSchema, 'params'),
  deactivateLocation,
);
