import type { ClientSession, Types } from 'mongoose';
import { Notification } from '../models/Notification.model';

export interface NotifyPayload {
  type: string;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId | string;
  linkUrl?: string;
}

/**
 * Creates one in-app notification per recipient. Pass a transaction session to
 * keep notification creation atomic with the action that triggered it.
 */
export async function notify(
  userIds: Array<Types.ObjectId | string>,
  payload: NotifyPayload,
  session?: ClientSession,
): Promise<void> {
  const uniqueRecipients = [...new Set(userIds.map((userId) => userId.toString()))];

  if (uniqueRecipients.length === 0) {
    return;
  }

  await Notification.insertMany(
    uniqueRecipients.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      titleKey: payload.titleKey,
      messageKey: payload.messageKey,
      params: payload.params,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
      linkUrl: payload.linkUrl,
      isRead: false,
    })),
    session ? { session } : {},
  );
}
