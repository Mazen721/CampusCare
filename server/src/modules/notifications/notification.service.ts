import type { Types } from 'mongoose';
import { ApiError } from '../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../shared/utils/paginate';
import { Notification, type INotification } from '../../shared/models/Notification.model';
import type { ListNotificationsQuery } from './notification.validation';

export interface SerializedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

function serializeNotification(notification: {
  _id: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}): SerializedNotification {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId?.toString(),
    linkUrl: notification.linkUrl,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<{
  data: SerializedNotification[];
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = { userId };

  if (query.unreadOnly === true) {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    ...paginate(notifications.map(serializeNotification), page, limit, total),
    unreadCount,
  };
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<SerializedNotification> {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isRead: true } },
    { new: true },
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return serializeNotification(notification);
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<{ updated: number }> {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } },
  );

  return { updated: result.modifiedCount };
}
