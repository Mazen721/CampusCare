import type { Request, Response } from 'express';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  addTechnicianNote as addTechnicianNoteService,
  assignWorkOrder as assignWorkOrderService,
  cancelWorkOrder as cancelWorkOrderService,
  completeWorkOrder as completeWorkOrderService,
  getWorkOrder as getWorkOrderService,
  listWorkOrders as listWorkOrdersService,
  startWorkOrder as startWorkOrderService,
} from './workOrder.service';
import type {
  AddNoteInput,
  AssignWorkOrderInput,
  CancelWorkOrderInput,
  CompleteWorkOrderInput,
  ListWorkOrdersQuery,
} from './workOrder.validation';

function requireActor(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return {
    id: req.user._id.toString(),
    role: req.user.role,
  };
}

export const listWorkOrders = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await listWorkOrdersService(
    actor,
    req.query as unknown as ListWorkOrdersQuery,
  );
  res.status(200).json(result);
});

export const getWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await getWorkOrderService(actor, id);
  res.status(200).json({ workOrder });
});

export const assignWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await assignWorkOrderService(
    actor,
    id,
    req.body as AssignWorkOrderInput,
  );
  res.status(200).json({ workOrder });
});

export const startWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await startWorkOrderService(actor, id);
  res.status(200).json({ workOrder });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await addTechnicianNoteService(
    actor,
    id,
    req.body as AddNoteInput,
  );
  res.status(200).json({ workOrder });
});

export const completeWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await completeWorkOrderService(
    actor,
    id,
    req.body as CompleteWorkOrderInput,
  );
  res.status(200).json({ workOrder });
});

export const cancelWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const workOrder = await cancelWorkOrderService(
    actor,
    id,
    req.body as CancelWorkOrderInput,
  );
  res.status(200).json({ workOrder });
});
