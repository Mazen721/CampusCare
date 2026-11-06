import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type {
  AppNotification,
  NotificationsResponse,
} from '@/types/notifications';

export interface ListNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export const notificationsApi = {
  list(params: ListNotificationsParams = {}): Promise<NotificationsResponse> {
    return api.get<NotificationsResponse>(`/notifications${toQueryString(params)}`);
  },
  markRead(id: string): Promise<{ notification: AppNotification }> {
    return api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`);
  },
  markAllRead(): Promise<{ updated: number }> {
    return api.patch<{ updated: number }>('/notifications/read-all');
  },
};
