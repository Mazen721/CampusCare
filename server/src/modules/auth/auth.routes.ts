import { Router } from 'express';
import { env } from '../../config/env';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  changePassword,
  demoLogin,
  login,
  me,
} from './auth.controller';
import {
  changePasswordSchema,
  demoLoginSchema,
  loginSchema,
} from './auth.validation';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), login);

// Registered only when demo mode is enabled on the server.
if (env.DEMO_MODE) {
  authRouter.post('/demo-login', validate(demoLoginSchema), demoLogin);
}

authRouter.get('/me', authenticate, me);
authRouter.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);
