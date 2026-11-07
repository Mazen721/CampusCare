import type { Request, Response } from 'express';
import { uploadImages } from '../../../shared/services/upload.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  createItem as createItemService,
  getItem as getItemService,
  listItems as listItemsService,
  updateItem as updateItemService,
} from './item.service';
import type { ItemActor } from './item.service';
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from './item.validation';

function requireActor(req: Request): ItemActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

function requestBaseUrl(req: Request): string {
  const host = req.get('host');
  return host ? `${req.protocol}://${host}` : '';
}

function uploadedFiles(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const images = await uploadImages(uploadedFiles(req), requestBaseUrl(req));
  const item = await createItemService(
    actor,
    req.body as CreateItemInput,
    images,
  );
  res.status(201).json({ item });
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await listItemsService(
    actor,
    req.query as unknown as ListItemsQuery,
  );
  res.status(200).json(result);
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const item = await getItemService(actor, id);
  res.status(200).json({ item });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const item = await updateItemService(
    actor,
    id,
    req.body as UpdateItemInput,
  );
  res.status(200).json({ item });
});
