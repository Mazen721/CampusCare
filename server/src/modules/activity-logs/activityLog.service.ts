import { Types, type FilterQuery } from 'mongoose';
import type { Role } from '../../config/constants';
import {
  ActivityLog,
  type IActivityLog,
} from '../../shared/models/ActivityLog.model';
import { paginate, parsePagination } from '../../shared/utils/paginate';
import type { ListActivityLogsQuery } from './activityLog.validation';

interface PopulatedActor {
  _id: Types.ObjectId;
  name: string;
  nameAr?: string;
  email?: string;
  role?: Role;
}

interface PopulatedActivityLog
  extends Omit<IActivityLog, 'actorId'> {
  _id: Types.ObjectId;
  actorId?: PopulatedActor | null;
}

export interface SerializedActivityLog {
  id: string;
  actor: {
    id: string;
    name: string;
    nameAr?: string;
    email?: string;
    role?: Role;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  descriptionKey?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

function serializeActivityLog(entry: PopulatedActivityLog): SerializedActivityLog {
  const actor = entry.actorId;

  return {
    id: entry._id.toString(),
    actor:
      actor && actor._id
        ? {
            id: actor._id.toString(),
            name: actor.name,
            nameAr: actor.nameAr,
            email: actor.email,
            role: actor.role,
          }
        : null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId.toString(),
    description: entry.description,
    descriptionKey: entry.descriptionKey,
    params: entry.params,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  };
}

export async function listActivityLogs(query: ListActivityLogsQuery): Promise<{
  data: SerializedActivityLog[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IActivityLog> = {};

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.actorId) {
    filter.actorId = new Types.ObjectId(query.actorId);
  }

  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }

  const [entries, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('actorId', 'name nameAr email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PopulatedActivityLog[]>(),
    ActivityLog.countDocuments(filter),
  ]);

  return paginate(entries.map(serializeActivityLog), page, limit, total);
}
