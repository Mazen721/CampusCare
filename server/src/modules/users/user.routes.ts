import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorizeRoles } from '../../shared/middleware/authorizeRoles';
import { validate } from '../../shared/middleware/validate';
import {
  createUser,
  getUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from './user.controller';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdSchema,
} from './user.validation';

export const userRouter = Router();

userRouter.use(authenticate, authorizeRoles('SUPER_ADMIN'));

userRouter.get('/', validate(listUsersQuerySchema, 'query'), listUsers);
userRouter.get('/:id', validate(userIdSchema, 'params'), getUser);
userRouter.post('/', validate(createUserSchema), createUser);
userRouter.patch(
  '/:id',
  validate(userIdSchema, 'params'),
  validate(updateUserSchema),
  updateUser,
);
userRouter.patch(
  '/:id/status',
  validate(userIdSchema, 'params'),
  validate(updateUserStatusSchema),
  updateUserStatus,
);
