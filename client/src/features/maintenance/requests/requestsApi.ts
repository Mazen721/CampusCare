import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreateRequestInput,
  ListRequestsParams,
  MaintenanceRequestRecord,
  ReviewRequestInput,
  ReviewRequestResponse,
} from '@/types/maintenance';

function toFormData(input: CreateRequestInput): FormData {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('description', input.description);
  formData.append('category', input.category);
  formData.append('priority', input.priority);
  formData.append('locationId', input.locationId);

  if (input.equipmentDescription) {
    formData.append('equipmentDescription', input.equipmentDescription);
  }

  input.images.forEach((image) => formData.append('images', image));
  return formData;
}

export const requestsApi = {
  create(input: CreateRequestInput): Promise<{ request: MaintenanceRequestRecord }> {
    return api.post<{ request: MaintenanceRequestRecord }>('/maintenance/requests', toFormData(input));
  },
  list(params: ListRequestsParams = {}): Promise<PaginatedResponse<MaintenanceRequestRecord>> {
    return api.get<PaginatedResponse<MaintenanceRequestRecord>>(
      `/maintenance/requests${toQueryString(params)}`,
    );
  },
  get(id: string): Promise<{ request: MaintenanceRequestRecord }> {
    return api.get<{ request: MaintenanceRequestRecord }>(`/maintenance/requests/${id}`);
  },
  review(id: string, input: ReviewRequestInput): Promise<ReviewRequestResponse> {
    return api.patch<ReviewRequestResponse>(`/maintenance/requests/${id}/review`, input);
  },
};
