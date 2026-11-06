import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createUser as createUserService,
  getUser as getUserService,
  listUsers as listUsersService,
  updateUser as updateUserService,
  updateUserStatus as updateUserStatusService,
} from './user.service';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UpdateUserStatusInput,
} from './user.validation';

function requireActor(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

function userId(req: Request): string {
  return (req.params as { id: string }).id;
}

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUsersService(req.query as unknown as ListUsersQuery);
  res.status(200).json(result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserService(userId(req));
  res.status(200).json({ user });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const user = await createUserService(actor._id.toString(), req.body as CreateUserInput);
  res.status(201).json({ user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const user = await updateUserService(
    actor._id.toString(),
    userId(req),
    req.body as UpdateUserInput,
  );
  res.status(200).json({ user });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { isActive } = req.body as UpdateUserStatusInput;
  const user = await updateUserStatusService(actor._id.toString(), userId(req), isActive);
  res.status(200).json({ user });
});
