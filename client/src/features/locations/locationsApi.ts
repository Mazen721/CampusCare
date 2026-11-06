import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreateLocationInput,
  LocationRecord,
  UpdateLocationInput,
} from '@/types/locations';

export interface ListLocationsParams {
  q?: string;
  includeInactive?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const locationsApi = {
  list(params: ListLocationsParams = {}): Promise<PaginatedResponse<LocationRecord>> {
    return api.get<PaginatedResponse<LocationRecord>>(`/locations${toQueryString(params)}`);
  },
  create(input: CreateLocationInput): Promise<{ location: LocationRecord }> {
    return api.post<{ location: LocationRecord }>('/locations', input);
  },
  update(id: string, input: UpdateLocationInput): Promise<{ location: LocationRecord }> {
    return api.patch<{ location: LocationRecord }>(`/locations/${id}`, input);
  },
  deactivate(id: string): Promise<{ location: LocationRecord }> {
    return api.delete<{ location: LocationRecord }>(`/locations/${id}`);
  },
};
