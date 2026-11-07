import type { Request, Response } from 'express';
import { ApiError } from '../../../shared/utils/ApiError';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { getCalendar as getCalendarService } from './calendar.service';
import type { CalendarActor } from './calendar.service';
import type { CalendarQuery } from './calendar.validation';

function requireActor(req: Request): CalendarActor {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  return { id: req.user._id.toString(), role: req.user.role };
}

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const result = await getCalendarService(actor, req.query as unknown as CalendarQuery);
  res.status(200).json(result);
});
