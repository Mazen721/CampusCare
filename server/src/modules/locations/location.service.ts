import type { Types } from 'mongoose';
import type { Role } from '../../config/constants';
import { logActivity } from '../../shared/services/activityLog.service';
import { ApiError } from '../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../shared/utils/paginate';
import { Location, type ILocation } from './location.model';
import type {
  CreateLocationInput,
  ListLocationsQuery,
  UpdateLocationInput,
} from './location.validation';

export interface SerializedLocation {
  id: string;
  buildingName: string;
  floor: string;
  room: string;
  locationType: ILocation['locationType'];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeLocation(location: {
  _id: Types.ObjectId;
  buildingName: string;
  floor: string;
  room: string;
  locationType: ILocation['locationType'];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SerializedLocation {
  return {
    id: location._id.toString(),
    buildingName: location.buildingName,
    floor: location.floor,
    room: location.room,
    locationType: location.locationType,
    description: location.description,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assertUniqueCombination(
  buildingName: string,
  floor: string,
  room: string,
  excludeId?: string,
): Promise<void> {
  const duplicate = await Location.findOne({
    buildingName,
    floor,
    room,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('_id');

  if (duplicate) {
    throw ApiError.conflict(
      'A location with this building, floor and room already exists',
    );
  }
}

export async function listLocations(
  query: ListLocationsQuery,
  role: Role,
): Promise<{
  data: SerializedLocation[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const isAdmin = role === 'SUPER_ADMIN';
  const includeInactive = isAdmin && query.includeInactive === true;

  const filter: Record<string, unknown> = {};

  if (!includeInactive) {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    filter.$or = [
      { buildingName: pattern },
      { floor: pattern },
      { room: pattern },
      { description: pattern },
    ];
  }

  const [documents, total] = await Promise.all([
    Location.find(filter)
      .sort({ buildingName: 1, floor: 1, room: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Location.countDocuments(filter),
  ]);

  return paginate(documents.map(serializeLocation), page, limit, total);
}

export async function getLocation(id: string): Promise<SerializedLocation> {
  const location = await Location.findById(id);

  if (!location) {
    throw ApiError.notFound('Location not found');
  }

  return serializeLocation(location);
}

export async function createLocation(
  actorId: string,
  input: CreateLocationInput,
): Promise<SerializedLocation> {
  await assertUniqueCombination(input.buildingName, input.floor, input.room);

  const location = await Location.create({
    ...input,
    isActive: true,
  });

  await logActivity({
    actorId,
    action: 'LOCATION_CREATED',
    entityType: 'Location',
    entityId: location._id,
    description: `Created location ${location.buildingName}, ${location.floor}, Room ${location.room}`,
    metadata: { buildingName: location.buildingName, floor: location.floor, room: location.room },
  });

  return serializeLocation(location);
}

export async function updateLocation(
  actorId: string,
  id: string,
  input: UpdateLocationInput,
): Promise<SerializedLocation> {
  const location = await Location.findById(id);

  if (!location) {
    throw ApiError.notFound('Location not found');
  }

  const buildingName = input.buildingName ?? location.buildingName;
  const floor = input.floor ?? location.floor;
  const room = input.room ?? location.room;

  if (buildingName !== location.buildingName || floor !== location.floor || room !== location.room) {
    await assertUniqueCombination(buildingName, floor, room, id);
  }

  Object.assign(location, input);
  await location.save();

  await logActivity({
    actorId,
    action: 'LOCATION_UPDATED',
    entityType: 'Location',
    entityId: location._id,
    description: `Updated location ${location.buildingName}, ${location.floor}, Room ${location.room}`,
    metadata: { fields: Object.keys(input) },
  });

  return serializeLocation(location);
}

export async function deactivateLocation(
  actorId: string,
  id: string,
): Promise<SerializedLocation> {
  const location = await Location.findById(id);

  if (!location) {
    throw ApiError.notFound('Location not found');
  }

  if (location.isActive) {
    location.isActive = false;
    await location.save();

    await logActivity({
      actorId,
      action: 'LOCATION_DEACTIVATED',
      entityType: 'Location',
      entityId: location._id,
      description: `Deactivated location ${location.buildingName}, ${location.floor}, Room ${location.room}`,
      metadata: { buildingName: location.buildingName, floor: location.floor, room: location.room },
    });
  }

  return serializeLocation(location);
}
