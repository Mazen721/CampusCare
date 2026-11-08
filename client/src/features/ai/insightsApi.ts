import { api } from '@/lib/api';
import type { MaintenanceInsightsResponse } from '@/types/insights';

export type InsightsPeriod = '7d' | '30d';

export interface GenerateInsightsInput {
  period: InsightsPeriod;
  regenerate?: boolean;
}

export const insightsApi = {
  generate(input: GenerateInsightsInput): Promise<MaintenanceInsightsResponse> {
    return api.post<MaintenanceInsightsResponse>('/ai/maintenance-insights', input);
  },
};
