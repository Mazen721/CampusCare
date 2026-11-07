import { api } from '@/lib/api';

export interface WorkOrderSummaryResult {
  available: boolean;
  text?: string;
  generatedAt?: string;
  message?: string;
}

export const aiApi = {
  summarizeWorkOrder(workOrderId: string): Promise<WorkOrderSummaryResult> {
    return api.post<WorkOrderSummaryResult>('/ai/work-order-summary', {
      workOrderId,
    });
  },
};
