import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { listActivityLogs as listActivityLogsService } from './activityLog.service';
import type { ListActivityLogsQuery } from './activityLog.validation';

export const listActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await listActivityLogsService(
    req.query as unknown as ListActivityLogsQuery,
  );
  res.status(200).json(result);
});
