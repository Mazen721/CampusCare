import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { meta } from './meta.controller';

export const metaRouter = Router();

metaRouter.get('/', authenticate, meta);
