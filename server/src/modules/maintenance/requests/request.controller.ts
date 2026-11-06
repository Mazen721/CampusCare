import type { Request, Response } from 'express';
import { uploadImages } from '../../../shared/services/upload.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  createRequest as createRequestService,
  getRequest as getRequestService,
  listRequests as listRequestsService,
  reviewRequest as reviewRequestService,
} from './request.service';
import type {
  CreateRequestInput,
  ListRequestsQuery,
  ReviewRequestInput,
} from './request.validation';
import type { RequestActor } from './request.service';

function requireActor(req: Request): RequestActor {
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

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const attachments = await uploadImages(uploadedFiles(req), requestBaseUrl(req));
  const request = await createRequestService(
    actor.id,
    req.body as CreateRequestInput,
    attachments,
  );
  res.status(201).json({ request });
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await listRequestsService(
    actor,
    req.query as unknown as ListRequestsQuery,
  );
  res.status(200).json(result);
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const request = await getRequestService(actor, id);
  res.status(200).json({ request });
});

export const reviewRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const result = await reviewRequestService(
    actor,
    id,
    req.body as ReviewRequestInput,
  );
  res.status(200).json(result);
});
