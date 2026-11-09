import { Types, type HydratedDocument } from 'mongoose';
import type {
  ItemStatus,
  LostFoundCategory,
  ReportType,
} from '../../../config/constants';
import { ApiError } from '../../../shared/utils/ApiError';
import { LostFoundItem } from '../items/lostFoundItem.model';
import { ItemMatch, type IItemMatch } from './itemMatch.model';
import {
  canRefreshMatch,
  scorePair,
  type MatchableItem,
  type MatchableLocation,
} from './matching.service';

interface LeanLocation {
  _id: Types.ObjectId;
  buildingName?: string;
  floor?: string;
}

interface LeanItem {
  _id: Types.ObjectId;
  reportType: ReportType;
  category: LostFoundCategory;
  locationId?: Types.ObjectId | LeanLocation | null;
  occurrenceDate: Date;
  color?: string;
  brand?: string;
  itemTitle: string;
  description: string;
  status: ItemStatus;
  reporterId: Types.ObjectId;
}

export interface MatchingRunResult {
  considered: number;
  created: number;
  updated: number;
  removed: number;
  skipped: number;
}

const LOCATION_POPULATION = {
  path: 'locationId',
  select: 'buildingName floor',
};

function isLeanLocation(value: unknown): value is LeanLocation {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'buildingName' in value
  );
}

function toMatchableLocation(
  value: LeanItem['locationId'],
): MatchableLocation | null {
  if (!value) {
    return null;
  }

  if (value instanceof Types.ObjectId) {
    return { id: value.toString() };
  }

  if (isLeanLocation(value)) {
    return {
      id: value._id.toString(),
      buildingName: value.buildingName,
      floor: value.floor,
    };
  }

  return null;
}

function toMatchableItem(item: LeanItem): MatchableItem {
  return {
    id: item._id.toString(),
    reportType: item.reportType,
    category: item.category,
    location: toMatchableLocation(item.locationId),
    occurrenceDate: item.occurrenceDate,
    color: item.color,
    brand: item.brand,
    itemTitle: item.itemTitle,
    description: item.description,
  };
}

function pairKey(lostItemId: string, foundItemId: string): string {
  return `${lostItemId}:${foundItemId}`;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function emptyResult(): MatchingRunResult {
  return { considered: 0, created: 0, updated: 0, removed: 0, skipped: 0 };
}

/**
 * Scores one item against every OPEN candidate of the opposite type and
 * persists the suggestions. Only SUGGESTED matches may be refreshed; confirmed
 * and dismissed decisions are never resurrected (MASTER_SPEC section 6.3).
 */
export async function runMatchingFor(
  itemId: string,
): Promise<MatchingRunResult> {
  const source = await LostFoundItem.findById(itemId)
    .populate(LOCATION_POPULATION)
    .lean<LeanItem | null>();

  if (!source) {
    throw ApiError.notFound('Lost and found item not found', 'itemNotFound');
  }

  if (source.status !== 'OPEN') {
    return emptyResult();
  }

  const oppositeType: ReportType = source.reportType === 'LOST' ? 'FOUND' : 'LOST';
  const candidates = await LostFoundItem.find({
    _id: { $ne: source._id },
    reportType: oppositeType,
    status: 'OPEN',
  })
    .populate(LOCATION_POPULATION)
    .lean<LeanItem[]>();

  const existingMatches = await ItemMatch.find({
    $or: [{ lostItemId: source._id }, { foundItemId: source._id }],
  });

  const existingByPair = new Map<string, HydratedDocument<IItemMatch>>();
  existingMatches.forEach((match) => {
    existingByPair.set(
      pairKey(match.lostItemId.toString(), match.foundItemId.toString()),
      match,
    );
  });

  const result = emptyResult();
  const sourceItem = toMatchableItem(source);

  for (const candidate of candidates) {
    result.considered += 1;

    const candidateItem = toMatchableItem(candidate);
    const lost =
      source.reportType === 'LOST' ? sourceItem : candidateItem;
    const found =
      source.reportType === 'FOUND' ? sourceItem : candidateItem;

    const key = pairKey(lost.id, found.id);
    const existing = existingByPair.get(key);

    if (existing && !canRefreshMatch(existing.status)) {
      result.skipped += 1;
      continue;
    }

    const scored = scorePair(lost, found);

    if (!scored || scored.level === null) {
      if (existing) {
        await existing.deleteOne();
        existingByPair.delete(key);
        result.removed += 1;
      }
      continue;
    }

    if (existing) {
      existing.score = scored.score;
      existing.level = scored.level;
      existing.breakdown = scored.breakdown;
      await existing.save();
      result.updated += 1;
      continue;
    }

    try {
      const created = await ItemMatch.create({
        lostItemId: new Types.ObjectId(lost.id),
        foundItemId: new Types.ObjectId(found.id),
        score: scored.score,
        level: scored.level,
        breakdown: scored.breakdown,
        status: 'SUGGESTED',
      });
      existingByPair.set(key, created);
      result.created += 1;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        result.skipped += 1;
        continue;
      }
      throw error;
    }
  }

  return result;
}
