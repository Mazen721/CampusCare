import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { summarizeWorkOrder as summarizeWorkOrderService } from './workOrderSummary.service';
import type { WorkOrderSummaryBody } from './ai.validation';
import type { AiActor } from './workOrderSummary.service';

function requireActor(req: Request): AiActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

export const summarizeWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { workOrderId } = req.body as WorkOrderSummaryBody;
  const result = await summarizeWorkOrderService(actor, workOrderId);
  res.status(200).json(result);
});
