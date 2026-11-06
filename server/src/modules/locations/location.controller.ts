import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createLocation as createLocationService,
  deactivateLocation as deactivateLocationService,
  listLocations as listLocationsService,
  updateLocation as updateLocationService,
} from './location.service';
import type {
  CreateLocationInput,
  ListLocationsQuery,
  UpdateLocationInput,
} from './location.validation';

function requireActor(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const user = requireActor(req);
  const result = await listLocationsService(
    req.query as unknown as ListLocationsQuery,
    user.role,
  );
  res.status(200).json(result);
});

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = requireActor(req);
  const location = await createLocationService(
    user._id.toString(),
    req.body as CreateLocationInput,
  );
  res.status(201).json({ location });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = requireActor(req);
  const { id } = req.params as { id: string };
  const location = await updateLocationService(
    user._id.toString(),
    id,
    req.body as UpdateLocationInput,
  );
  res.status(200).json({ location });
});

export const deactivateLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = requireActor(req);
  const { id } = req.params as { id: string };
  const location = await deactivateLocationService(user._id.toString(), id);
  res.status(200).json({ location });
});
