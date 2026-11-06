import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { validate } from '../../../shared/middleware/validate';
import { createFeedback, listFeedback } from './feedback.controller';
import {
  createFeedbackSchema,
  listFeedbackQuerySchema,
} from './feedback.validation';

export const feedbackRouter = Router();

feedbackRouter.use(authenticate);

feedbackRouter.post(
  '/',
  authorizeRoles('STUDENT_EMPLOYEE'),
  validate(createFeedbackSchema),
  createFeedback,
);

feedbackRouter.get(
  '/',
  authorizeRoles('MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'STUDENT_EMPLOYEE'),
  validate(listFeedbackQuerySchema, 'query'),
  listFeedback,
);
