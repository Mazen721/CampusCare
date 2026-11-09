import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    titleKey: { type: String, trim: true },
    messageKey: { type: String, trim: true },
    params: { type: Schema.Types.Mixed },
    relatedEntityType: { type: String, trim: true },
    relatedEntityId: { type: Schema.Types.ObjectId },
    linkUrl: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification =
  (models.Notification as Model<INotification> | undefined) ??
  model<INotification>('Notification', notificationSchema);
