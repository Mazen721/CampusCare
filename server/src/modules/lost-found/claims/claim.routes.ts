import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { uploadRequestImages } from '../../../shared/middleware/upload';
import { validate } from '../../../shared/middleware/validate';
import {
  createClaim,
  getClaim,
  listClaims,
  recordHandover,
  reviewClaim,
} from './claim.controller';
import {
  claimIdSchema,
  createClaimSchema,
  handoverClaimSchema,
  listClaimsQuerySchema,
  reviewClaimSchema,
} from './claim.validation';

export const claimRouter = Router();

claimRouter.use(authenticate);
claimRouter.use(authorizeRoles('STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER'));

claimRouter.post(
  '/',
  authorizeRoles('STUDENT_EMPLOYEE'),
  uploadRequestImages,
  validate(createClaimSchema),
  createClaim,
);

claimRouter.get('/', validate(listClaimsQuerySchema, 'query'), listClaims);

claimRouter.get('/:id', validate(claimIdSchema, 'params'), getClaim);

claimRouter.patch(
  '/:id/review',
  authorizeRoles('LOST_FOUND_OFFICER'),
  validate(claimIdSchema, 'params'),
  validate(reviewClaimSchema),
  reviewClaim,
);

claimRouter.post(
  '/:id/handover',
  authorizeRoles('LOST_FOUND_OFFICER'),
  validate(claimIdSchema, 'params'),
  validate(handoverClaimSchema),
  recordHandover,
);
