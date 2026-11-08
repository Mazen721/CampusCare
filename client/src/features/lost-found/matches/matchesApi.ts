import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  ItemMatch,
  ListMatchesParams,
  ReviewMatchInput,
} from '@/types/matches';

export const matchesApi = {
  list(params: ListMatchesParams = {}): Promise<PaginatedResponse<ItemMatch>> {
    return api.get<PaginatedResponse<ItemMatch>>(
      `/lost-found/matches${toQueryString(params)}`,
    );
  },

  review(id: string, input: ReviewMatchInput): Promise<{ match: ItemMatch }> {
    return api.patch<{ match: ItemMatch }>(`/lost-found/matches/${id}`, input);
  },
};
