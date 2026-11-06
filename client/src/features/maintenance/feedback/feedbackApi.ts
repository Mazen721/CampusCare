import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type {
  CreateFeedbackInput,
  FeedbackListResponse,
  ListFeedbackParams,
  ServiceFeedbackRecord,
} from '@/types/feedback';

export const feedbackApi = {
  list(params: ListFeedbackParams = {}): Promise<FeedbackListResponse> {
    return api.get<FeedbackListResponse>(`/feedback${toQueryString(params)}`);
  },

  create(input: CreateFeedbackInput): Promise<{ feedback: ServiceFeedbackRecord }> {
    return api.post<{ feedback: ServiceFeedbackRecord }>('/feedback', input);
  },
};
