import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import { listMatches, reviewMatch } from './match.controller';
import {
  listMatchesQuerySchema,
  matchIdSchema,
  reviewMatchSchema,
} from './match.validation';

export const matchRouter = Router();

matchRouter.use(authenticate);
matchRouter.use(authorizeRoles('LOST_FOUND_OFFICER'));

matchRouter.get('/', validate(listMatchesQuerySchema, 'query'), listMatches);

matchRouter.patch(
  '/:id',
  validate(matchIdSchema, 'params'),
  validate(reviewMatchSchema),
  reviewMatch,
);
