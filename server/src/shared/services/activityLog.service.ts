import type { ClientSession, Types } from 'mongoose';
import { ActivityLog } from '../models/ActivityLog.model';

export interface ActivityLogEntry {
  actorId: Types.ObjectId | string;
  action: string;
  entityType: string;
  entityId: Types.ObjectId | string;
  description: string;
  descriptionKey?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Appends an immutable audit entry. There is intentionally no update or delete
 * path for activity logs anywhere in the application.
 */
export async function logActivity(
  entry: ActivityLogEntry,
  session?: ClientSession,
): Promise<void> {
  await ActivityLog.create(
    [
      {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        descriptionKey: entry.descriptionKey,
        params: entry.params,
        metadata: entry.metadata,
      },
    ],
    session ? { session } : {},
  );
}
