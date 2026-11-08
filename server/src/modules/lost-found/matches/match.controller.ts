import type { Request, Response } from 'express';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  listMatches as listMatchesService,
  reviewMatch as reviewMatchService,
} from './match.service';
import type { MatchActor } from './match.service';
import type {
  ListMatchesQuery,
  ReviewMatchInput,
} from './match.validation';

function requireActor(req: Request): MatchActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

export const listMatches = asyncHandler(async (req: Request, res: Response) => {
  const result = await listMatchesService(
    req.query as unknown as ListMatchesQuery,
  );
  res.status(200).json(result);
});

export const reviewMatch = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const match = await reviewMatchService(
    actor,
    id,
    req.body as ReviewMatchInput,
  );
  res.status(200).json({ match });
});
