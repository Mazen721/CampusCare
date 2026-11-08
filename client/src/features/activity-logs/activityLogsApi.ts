import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type { ActivityLogRecord } from '@/types/activityLogs';

export interface ListActivityLogsParams {
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const activityLogsApi = {
  list(params: ListActivityLogsParams = {}): Promise<PaginatedResponse<ActivityLogRecord>> {
    return api.get<PaginatedResponse<ActivityLogRecord>>(
      `/activity-logs${toQueryString(params)}`,
    );
  },
};
