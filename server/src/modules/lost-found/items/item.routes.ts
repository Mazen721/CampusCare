import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { authorizeRoles } from '../../../shared/middleware/authorizeRoles';
import { uploadRequestImages } from '../../../shared/middleware/upload';
import { validate } from '../../../shared/middleware/validate';
import {
  createItem,
  getItem,
  listItems,
  updateItem,
} from './item.controller';
import {
  createItemSchema,
  itemIdSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from './item.validation';

export const lostFoundItemRouter = Router();

lostFoundItemRouter.use(authenticate);

lostFoundItemRouter.post(
  '/',
  authorizeRoles('STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER'),
  uploadRequestImages,
  validate(createItemSchema),
  createItem,
);

lostFoundItemRouter.get(
  '/',
  validate(listItemsQuerySchema, 'query'),
  listItems,
);

lostFoundItemRouter.get('/:id', validate(itemIdSchema, 'params'), getItem);

lostFoundItemRouter.patch(
  '/:id',
  authorizeRoles('STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER'),
  validate(itemIdSchema, 'params'),
  validate(updateItemSchema),
  updateItem,
);
