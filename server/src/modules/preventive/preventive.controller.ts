import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createPreventivePlan as createPreventivePlanService,
  generateDueWorkOrders as generateDueWorkOrdersService,
  listPreventivePlans as listPreventivePlansService,
  updatePreventivePlan as updatePreventivePlanService,
  updatePreventivePlanStatus as updatePreventivePlanStatusService,
} from './preventive.service';
import type {
  CreatePreventivePlanInput,
  ListPreventivePlansQuery,
  UpdatePreventivePlanInput,
  UpdatePreventivePlanStatusInput,
} from './preventive.validation';

function requireActorId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return req.user._id.toString();
}

export const listPreventivePlans = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listPreventivePlansService(
      req.query as unknown as ListPreventivePlansQuery,
    );
    res.status(200).json(result);
  },
);

export const createPreventivePlan = asyncHandler(
  async (req: Request, res: Response) => {
    const plan = await createPreventivePlanService(
      requireActorId(req),
      req.body as CreatePreventivePlanInput,
    );
    res.status(201).json({ plan });
  },
);

export const updatePreventivePlan = asyncHandler(
  async (req: Request, res: Response) => {
    const plan = await updatePreventivePlanService(
      requireActorId(req),
      req.params.id as string,
      req.body as UpdatePreventivePlanInput,
    );
    res.status(200).json({ plan });
  },
);

export const updatePreventivePlanStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const plan = await updatePreventivePlanStatusService(
      requireActorId(req),
      req.params.id as string,
      req.body as UpdatePreventivePlanStatusInput,
    );
    res.status(200).json({ plan });
  },
);

export const generateDueWorkOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { created } = await generateDueWorkOrdersService(requireActorId(req));
    res.status(200).json({ created });
  },
);
