import type { PaginatedResponse } from '@/types/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse extends PaginatedResponse<AppNotification> {
  unreadCount: number;
}
