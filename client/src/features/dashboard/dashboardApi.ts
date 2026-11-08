import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { DashboardPeriod, DashboardResponse } from '@/types/dashboard';

export const dashboardApi = {
  get(period: DashboardPeriod): Promise<DashboardResponse> {
    return api.get<DashboardResponse>(`/dashboard${toQueryString({ period })}`);
  },
};
