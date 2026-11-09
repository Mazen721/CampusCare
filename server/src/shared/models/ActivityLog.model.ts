import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface IActivityLog {
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  description: string;
  descriptionKey?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    description: { type: String, required: true, trim: true },
    descriptionKey: { type: String, trim: true },
    params: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

/**
 * Audit entries are immutable. There is intentionally no update/delete path.
 */
export const ActivityLog =
  (models.ActivityLog as Model<IActivityLog> | undefined) ??
  model<IActivityLog>('ActivityLog', activityLogSchema);
