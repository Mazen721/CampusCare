import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  changePassword as changePasswordService,
  demoLogin as demoLoginService,
  getCurrentUser,
  login as loginService,
} from './auth.service';
import type {
  ChangePasswordInput,
  DemoLoginInput,
  LoginInput,
} from './auth.validation';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginService(req.body as LoginInput);
  res.status(200).json(result);
});

export const demoLogin = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as DemoLoginInput;
  const result = await demoLoginService(role);
  res.status(200).json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await getCurrentUser(req.user._id.toString());
  res.status(200).json({ user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  await changePasswordService(req.user._id.toString(), req.body as ChangePasswordInput);
  res.status(200).json({ message: 'Password updated successfully' });
});
