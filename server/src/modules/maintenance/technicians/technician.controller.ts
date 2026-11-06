import type { Request, Response } from 'express';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import {
  createTechnician as createTechnicianService,
  getTechnician as getTechnicianService,
  listTechnicians as listTechniciansService,
  updateTechnician as updateTechnicianService,
} from './technician.service';
import type {
  CreateTechnicianInput,
  ListTechniciansQuery,
  UpdateTechnicianInput,
} from './technician.validation';

function requireActor(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const listTechnicians = asyncHandler(async (req: Request, res: Response) => {
  requireActor(req);
  const result = await listTechniciansService(
    req.query as unknown as ListTechniciansQuery,
  );
  res.status(200).json(result);
});

export const getTechnician = asyncHandler(async (req: Request, res: Response) => {
  requireActor(req);
  const { id } = req.params as { id: string };
  const technician = await getTechnicianService(id);
  res.status(200).json({ technician });
});

export const createTechnician = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const technician = await createTechnicianService(
    actor._id.toString(),
    req.body as CreateTechnicianInput,
  );
  res.status(201).json({ technician });
});

export const updateTechnician = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { id } = req.params as { id: string };
  const technician = await updateTechnicianService(
    actor._id.toString(),
    id,
    req.body as UpdateTechnicianInput,
  );
  res.status(200).json({ technician });
});
