import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { getDashboard as getDashboardService } from './dashboard.service';
import type { DashboardActor } from './dashboard.service';
import type { DashboardQuery } from './dashboard.validation';

function requireActor(req: Request): DashboardActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { period } = req.query as unknown as DashboardQuery;
  const result = await getDashboardService(actor, period);
  res.status(200).json(result);
});
