import type { Request, Response } from 'express';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  createFeedback as createFeedbackService,
  listFeedback as listFeedbackService,
} from './feedback.service';
import type {
  CreateFeedbackInput,
  ListFeedbackQuery,
} from './feedback.validation';

function requireActor(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return {
    id: req.user._id.toString(),
    role: req.user.role,
  };
}

export const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const feedback = await createFeedbackService(
    actor.id,
    req.body as CreateFeedbackInput,
  );
  res.status(201).json({ feedback });
});

export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await listFeedbackService(
    actor,
    req.query as unknown as ListFeedbackQuery,
  );
  res.status(200).json(result);
});
