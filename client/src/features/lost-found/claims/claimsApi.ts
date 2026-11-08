import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { PaginatedResponse } from '@/types/api';
import type {
  ClaimRecord,
  CreateClaimInput,
  HandoverClaimInput,
  ListClaimsParams,
  ReviewClaimInput,
} from '@/types/claims';

function toFormData(input: CreateClaimInput): FormData {
  const formData = new FormData();
  formData.append('itemId', input.itemId);
  formData.append('claimDescription', input.claimDescription);
  formData.append('identifyingDetailsProvided', input.identifyingDetailsProvided);

  if (input.linkedLostItemId) {
    formData.append('linkedLostItemId', input.linkedLostItemId);
  }

  input.images.forEach((image) => formData.append('images', image));

  return formData;
}

export const claimsApi = {
  create(input: CreateClaimInput): Promise<{ claim: ClaimRecord }> {
    return api.post<{ claim: ClaimRecord }>('/lost-found/claims', toFormData(input));
  },

  list(params: ListClaimsParams = {}): Promise<PaginatedResponse<ClaimRecord>> {
    return api.get<PaginatedResponse<ClaimRecord>>(
      `/lost-found/claims${toQueryString(params)}`,
    );
  },

  get(id: string): Promise<{ claim: ClaimRecord }> {
    return api.get<{ claim: ClaimRecord }>(`/lost-found/claims/${id}`);
  },

  review(id: string, input: ReviewClaimInput): Promise<{ claim: ClaimRecord }> {
    return api.patch<{ claim: ClaimRecord }>(`/lost-found/claims/${id}/review`, input);
  },

  handover(id: string, input: HandoverClaimInput): Promise<{ claim: ClaimRecord }> {
    return api.post<{ claim: ClaimRecord }>(`/lost-found/claims/${id}/handover`, input);
  },
};
