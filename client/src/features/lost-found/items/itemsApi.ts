import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreateLostFoundItemInput,
  ListLostFoundItemsParams,
  LostFoundItem,
  UpdateLostFoundItemInput,
} from '@/types/lostFound';

function toFormData(input: CreateLostFoundItemInput): FormData {
  const formData = new FormData();
  formData.append('reportType', input.reportType);
  formData.append('itemTitle', input.itemTitle);
  formData.append('description', input.description);
  formData.append('privateIdentificationDetails', input.privateIdentificationDetails);
  formData.append('category', input.category);
  formData.append('locationId', input.locationId);
  formData.append('locationDetails', input.locationDetails);
  formData.append('occurrenceDate', input.occurrenceDate);

  if (input.color) formData.append('color', input.color);
  if (input.brand) formData.append('brand', input.brand);
  input.images.forEach((image) => formData.append('images', image));

  return formData;
}

export const itemsApi = {
  create(input: CreateLostFoundItemInput): Promise<{ item: LostFoundItem }> {
    return api.post<{ item: LostFoundItem }>('/lost-found/items', toFormData(input));
  },

  list(params: ListLostFoundItemsParams = {}): Promise<PaginatedResponse<LostFoundItem>> {
    return api.get<PaginatedResponse<LostFoundItem>>(
      `/lost-found/items${toQueryString(params)}`,
    );
  },

  get(id: string): Promise<{ item: LostFoundItem }> {
    return api.get<{ item: LostFoundItem }>(`/lost-found/items/${id}`);
  },

  update(id: string, input: UpdateLostFoundItemInput): Promise<{ item: LostFoundItem }> {
    return api.patch<{ item: LostFoundItem }>(`/lost-found/items/${id}`, input);
  },

  close(id: string): Promise<{ item: LostFoundItem }> {
    return api.patch<{ item: LostFoundItem }>(`/lost-found/items/${id}`, {
      status: 'CLOSED',
    });
  },
};
