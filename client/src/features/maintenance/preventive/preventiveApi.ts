import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreatePreventivePlanInput,
  PreventivePlanRecord,
  UpdatePreventivePlanInput,
} from '@/types/preventive';

export interface ListPreventivePlansParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const preventiveApi = {
  list(
    params: ListPreventivePlansParams = {},
  ): Promise<PaginatedResponse<PreventivePlanRecord>> {
    return api.get<PaginatedResponse<PreventivePlanRecord>>(
      `/preventive-maintenance${toQueryString(params)}`,
    );
  },

  create(input: CreatePreventivePlanInput): Promise<{ plan: PreventivePlanRecord }> {
    return api.post<{ plan: PreventivePlanRecord }>('/preventive-maintenance', input);
  },

  update(
    id: string,
    input: UpdatePreventivePlanInput,
  ): Promise<{ plan: PreventivePlanRecord }> {
    return api.patch<{ plan: PreventivePlanRecord }>(
      `/preventive-maintenance/${id}`,
      input,
    );
  },

  updateStatus(id: string, isActive: boolean): Promise<{ plan: PreventivePlanRecord }> {
    return api.patch<{ plan: PreventivePlanRecord }>(
      `/preventive-maintenance/${id}/status`,
      { isActive },
    );
  },

  generateDue(): Promise<{ created: number }> {
    return api.post<{ created: number }>('/preventive-maintenance/generate-due');
  },
};
