import type { Request, Response } from 'express';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  listNotifications as listNotificationsService,
  markAllNotificationsRead as markAllNotificationsReadService,
  markNotificationRead as markNotificationReadService,
} from './notification.service';
import type { ListNotificationsQuery } from './notification.validation';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user._id.toString();
}

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await listNotificationsService(
    requireUserId(req),
    req.query as unknown as ListNotificationsQuery,
  );
  res.status(200).json(result);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const notification = await markNotificationReadService(requireUserId(req), id);
  res.status(200).json({ notification });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await markAllNotificationsReadService(requireUserId(req));
  res.status(200).json(result);
});
