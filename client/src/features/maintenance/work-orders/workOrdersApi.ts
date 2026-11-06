import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  AddNoteInput,
  AssignWorkOrderInput,
  CancelWorkOrderInput,
  CompleteWorkOrderInput,
  ListWorkOrdersParams,
  WorkOrderRecord,
} from '@/types/workOrders';

export const workOrdersApi = {
  list(params: ListWorkOrdersParams = {}): Promise<PaginatedResponse<WorkOrderRecord>> {
    return api.get<PaginatedResponse<WorkOrderRecord>>(`/work-orders${toQueryString(params)}`);
  },

  get(id: string): Promise<{ workOrder: WorkOrderRecord }> {
    return api.get<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}`);
  },

  assign(id: string, input: AssignWorkOrderInput): Promise<{ workOrder: WorkOrderRecord }> {
    return api.patch<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}/assign`, input);
  },

  start(id: string): Promise<{ workOrder: WorkOrderRecord }> {
    return api.patch<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}/start`);
  },

  addNote(id: string, input: AddNoteInput): Promise<{ workOrder: WorkOrderRecord }> {
    return api.post<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}/notes`, input);
  },

  complete(id: string, input: CompleteWorkOrderInput): Promise<{ workOrder: WorkOrderRecord }> {
    return api.patch<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}/complete`, input);
  },

  cancel(id: string, input: CancelWorkOrderInput): Promise<{ workOrder: WorkOrderRecord }> {
    return api.patch<{ workOrder: WorkOrderRecord }>(`/work-orders/${id}/cancel`, input);
  },
};
