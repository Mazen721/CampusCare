import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { getDashboard } from './dashboard.controller';
import { dashboardQuerySchema } from './dashboard.validation';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/', validate(dashboardQuerySchema, 'query'), getDashboard);
