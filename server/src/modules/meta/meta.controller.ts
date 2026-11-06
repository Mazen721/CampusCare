import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { getMeta } from './meta.service';

export const meta = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(getMeta());
});
