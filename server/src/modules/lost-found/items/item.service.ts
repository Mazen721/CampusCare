import { Types, type FilterQuery } from 'mongoose';
import type { ItemStatus, Role } from '../../../config/constants';
import type { ImageAsset } from '../../../shared/schemas/image.schema';
import { assertItemTransition } from '../../../shared/state-machines/item.sm';
import { logActivity } from '../../../shared/services/activityLog.service';
import { nextNumber } from '../../../shared/services/counter.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { Location } from '../../locations/location.model';
import { runMatchingFor } from '../matches/matching.runner';
import {
  LostFoundItem,
  type ILostFoundItem,
} from './lostFoundItem.model';
import {
  toPublicItem,
  type ProjectableItem,
  type PublicItem,
} from './item.projection';
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from './item.validation';

export interface ItemActor {
  id: string;
  role: Role;
}

interface PopulatedReporter {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  department?: string;
  role?: Role;
}

interface PopulatedItem extends ProjectableItem {
  privateIdentificationDetails?: string;
  reporterId?: Types.ObjectId | PopulatedReporter | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SerializedItem extends PublicItem {
  privateIdentificationDetails?: string;
  reporter?: {
    id: string;
    name: string;
    email?: string;
    department?: string;
    role?: Role;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const LOCATION_POPULATION = {
  path: 'locationId',
  select: 'buildingName floor room locationType',
};

const REPORTER_POPULATION = {
  path: 'reporterId',
  select: 'name email department role',
};

export const BROWSE_ACTIVE_STATUSES: ItemStatus[] = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
];

export const ARCHIVED_ITEM_STATUSES: ItemStatus[] = [
  'APPROVED_FOR_HANDOVER',
  'RETURNED',
  'CLOSED',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function objectIdOf(
  value: Types.ObjectId | { _id: Types.ObjectId } | null | undefined,
): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}

function serializeItem(item: PopulatedItem, includePrivate: boolean): SerializedItem {
  const publicItem = toPublicItem(item);

  if (!includePrivate) {
    return publicItem;
  }

  const reporter =
    item.reporterId && !(item.reporterId instanceof Types.ObjectId)
      ? {
          id: item.reporterId._id.toString(),
          name: item.reporterId.name,
          email: item.reporterId.email,
          department: item.reporterId.department,
          role: item.reporterId.role,
        }
      : null;

  return {
    ...publicItem,
    privateIdentificationDetails: item.privateIdentificationDetails,
    reporter,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function loadItem(id: string, includePrivate: boolean): Promise<PopulatedItem> {
  const query = LostFoundItem.findById(id)
    .populate(LOCATION_POPULATION)
    .populate(REPORTER_POPULATION);

  if (includePrivate) {
    query.select('+privateIdentificationDetails');
  }

  const item = await query.lean<PopulatedItem | null>();

  if (!item) {
    throw ApiError.notFound('Lost and found item not found');
  }

  return item;
}

async function requireActiveLocation(locationId: string): Promise<void> {
  const location = await Location.findOne({
    _id: locationId,
    isActive: true,
  })
    .select('_id')
    .lean();

  if (!location) {
    throw ApiError.badRequest('Select an active campus location');
  }
}

export async function createItem(
  actor: ItemActor,
  input: CreateItemInput,
  images: ImageAsset[],
): Promise<SerializedItem> {
  await requireActiveLocation(input.locationId);

  const reportNumber = await nextNumber('LF');
  const item = await LostFoundItem.create({
    reportNumber,
    reportType: input.reportType,
    itemTitle: input.itemTitle,
    description: input.description,
    privateIdentificationDetails: input.privateIdentificationDetails,
    category: input.category,
    color: input.color,
    brand: input.brand,
    locationId: input.locationId,
    locationDetails: input.locationDetails,
    occurrenceDate: input.occurrenceDate,
    images,
    reporterId: actor.id,
    status: 'OPEN',
  });

  await logActivity({
    actorId: actor.id,
    action: 'ITEM_REPORTED',
    entityType: 'LostFoundItem',
    entityId: item._id,
    description: `Reported ${input.reportType.toLowerCase()} item ${reportNumber} — ${input.itemTitle}`,
    metadata: {
      reportType: input.reportType,
      category: input.category,
      locationId: input.locationId,
      images: images.length,
    },
  });

  await runMatchingFor(item._id.toString());

  return serializeItem(await loadItem(item._id.toString(), true), true);
}

export async function listItems(
  actor: ItemActor,
  query: ListItemsQuery,
): Promise<{
  data: PublicItem[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<ILostFoundItem> = {};

  if (query.mine) {
    filter.reporterId = new Types.ObjectId(actor.id);
  }

  if (query.scope === 'archived') {
    if (actor.role !== 'LOST_FOUND_OFFICER' && actor.role !== 'SUPER_ADMIN') {
      throw ApiError.forbidden('Only Lost & Found Officers can view archived items');
    }
    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = { $in: ARCHIVED_ITEM_STATUSES };
    }
  } else if (query.scope === 'active') {
    if (query.status && BROWSE_ACTIVE_STATUSES.includes(query.status)) {
      filter.status = query.status;
    } else {
      filter.status = { $in: BROWSE_ACTIVE_STATUSES };
    }
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.reportType) filter.reportType = query.reportType;
  if (query.category) filter.category = query.category;
  if (query.locationId) filter.locationId = query.locationId;

  if (query.building) {
    const locationIds = await Location.find({
      buildingName: new RegExp(escapeRegExp(query.building), 'i'),
    }).distinct('_id');
    filter.locationId = { $in: locationIds };
  }

  if (query.color) {
    filter.color = new RegExp(escapeRegExp(query.color), 'i');
  }

  if (query.brand) {
    filter.brand = new RegExp(escapeRegExp(query.brand), 'i');
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    filter.$or = [
      { reportNumber: pattern },
      { itemTitle: pattern },
      { description: pattern },
    ];
  }

  if (query.from || query.to) {
    const occurrenceDate: Record<string, Date> = {};
    if (query.from) occurrenceDate.$gte = query.from;
    if (query.to) occurrenceDate.$lt = inclusiveDayEnd(query.to);
    filter.occurrenceDate = occurrenceDate;
  }

  const [documents, total] = await Promise.all([
    LostFoundItem.find(filter)
      .populate(LOCATION_POPULATION)
      .sort({ occurrenceDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PopulatedItem[]>(),
    LostFoundItem.countDocuments(filter),
  ]);

  return paginate(documents.map((document) => toPublicItem(document)), page, limit, total);
}

/** A date-only upper bound includes the whole selected day. */
function inclusiveDayEnd(value: Date): Date {
  const isMidnight =
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0;

  if (!isMidnight) return value;

  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function getItem(
  actor: ItemActor,
  id: string,
): Promise<SerializedItem> {
  const item = await loadItem(id, true);
  const reporterId = objectIdOf(item.reporterId);
  const isReporter = reporterId === actor.id;
  const isPrivileged =
    isReporter ||
    actor.role === 'LOST_FOUND_OFFICER' ||
    actor.role === 'SUPER_ADMIN';

  return serializeItem(item, isPrivileged);
}

export async function updateItem(
  actor: ItemActor,
  id: string,
  input: UpdateItemInput,
): Promise<SerializedItem> {
  const item = await LostFoundItem.findById(id).select(
    '+privateIdentificationDetails',
  );

  if (!item) {
    throw ApiError.notFound('Lost and found item not found');
  }

  const isReporter = item.reporterId.toString() === actor.id;
  const isOfficer = actor.role === 'LOST_FOUND_OFFICER';

  if (!isReporter && !isOfficer) {
    throw ApiError.forbidden('You cannot edit this lost and found item');
  }

  const fieldChanges = Object.entries(input).filter(
    ([key, value]) => key !== 'status' && value !== undefined,
  );
  const hasFieldChanges = fieldChanges.length > 0;

  if (hasFieldChanges) {
    if (isReporter && !isOfficer && item.status !== 'OPEN') {
      throw ApiError.forbidden('Only open reports can be edited');
    }

    if (isOfficer && (item.status === 'RETURNED' || item.status === 'CLOSED')) {
      throw ApiError.conflict(
        `Items with status ${item.status} cannot be edited`,
      );
    }
  }

  if (input.status === 'CLOSED') {
    if (isReporter && !isOfficer) {
      if (item.reportType !== 'LOST') {
        throw ApiError.forbidden(
          'Only the reporter of a LOST report can close it',
        );
      }
      assertItemTransition(item.status, 'CLOSED', 'REPORTER');
    } else {
      assertItemTransition(item.status, 'CLOSED', 'LOST_FOUND_OFFICER');
    }

    item.status = 'CLOSED';
  }

  if (input.locationId !== undefined) {
    await requireActiveLocation(input.locationId);
  }

  if (input.itemTitle !== undefined) item.itemTitle = input.itemTitle;
  if (input.description !== undefined) item.description = input.description;
  if (input.privateIdentificationDetails !== undefined) {
    item.privateIdentificationDetails = input.privateIdentificationDetails;
  }
  if (input.category !== undefined) item.category = input.category;
  if ('color' in input) item.color = input.color;
  if ('brand' in input) item.brand = input.brand;
  if (input.locationId !== undefined) item.locationId = new Types.ObjectId(input.locationId);
  if (input.locationDetails !== undefined) item.locationDetails = input.locationDetails;
  if (input.occurrenceDate !== undefined) item.occurrenceDate = input.occurrenceDate;

  await item.save();

  const closed = input.status === 'CLOSED';
  await logActivity({
    actorId: actor.id,
    action: closed ? 'ITEM_CLOSED' : 'ITEM_UPDATED',
    entityType: 'LostFoundItem',
    entityId: item._id,
    description: closed
      ? `Closed lost and found item ${item.reportNumber}`
      : `Updated lost and found item ${item.reportNumber}`,
    metadata: {
      status: item.status,
      fields: fieldChanges.map(([key]) => key),
    },
  });

  return getItem(actor, id);
}
