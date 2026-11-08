import { Types, type ClientSession, type FilterQuery } from 'mongoose';
import type { MatchLevel, MatchStatus, Role } from '../../../config/constants';
import { logActivity } from '../../../shared/services/activityLog.service';
import { notify } from '../../../shared/services/notification.service';
import { assertItemTransition } from '../../../shared/state-machines/item.sm';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { withTransaction } from '../../../shared/utils/withTransaction';
import { LostFoundItem } from '../items/lostFoundItem.model';
import {
  toPublicItem,
  type ProjectableItem,
  type PublicItem,
} from '../items/item.projection';
import { ItemMatch, type IItemMatch, type MatchBreakdown } from './itemMatch.model';
import type {
  ListMatchesQuery,
  ReviewMatchInput,
} from './match.validation';

export interface MatchActor {
  id: string;
  role: Role;
}

interface PopulatedReviewer {
  _id: Types.ObjectId;
  name: string;
  role?: Role;
}

interface PopulatedMatch {
  _id: Types.ObjectId;
  lostItemId?: ProjectableItem | null;
  foundItemId?: ProjectableItem | null;
  score: number;
  level: MatchLevel;
  breakdown: MatchBreakdown;
  status: MatchStatus;
  reviewedBy?: Types.ObjectId | PopulatedReviewer | null;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedMatch {
  id: string;
  score: number;
  level: MatchLevel;
  status: MatchStatus;
  breakdown: MatchBreakdown;
  lostItem: PublicItem | null;
  foundItem: PublicItem | null;
  reviewedBy: { id: string; name: string; role?: Role } | null;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PUBLIC_ITEM_SELECT =
  'reportNumber reportType itemTitle description category color brand locationDetails occurrenceDate images status locationId';

const LOCATION_POPULATE = {
  path: 'locationId',
  select: 'buildingName floor room locationType',
};

const LOST_ITEM_POPULATE = {
  path: 'lostItemId',
  select: PUBLIC_ITEM_SELECT,
  populate: LOCATION_POPULATE,
};

const FOUND_ITEM_POPULATE = {
  path: 'foundItemId',
  select: PUBLIC_ITEM_SELECT,
  populate: LOCATION_POPULATE,
};

const REVIEWER_POPULATE = {
  path: 'reviewedBy',
  select: 'name role',
};

function isProjectableItem(value: unknown): value is ProjectableItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'reportNumber' in value &&
    'status' in value
  );
}

function isPopulatedReviewer(value: unknown): value is PopulatedReviewer {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'name' in value
  );
}

function serializeMatch(doc: PopulatedMatch): SerializedMatch {
  const reviewer = isPopulatedReviewer(doc.reviewedBy)
    ? {
        id: doc.reviewedBy._id.toString(),
        name: doc.reviewedBy.name,
        role: doc.reviewedBy.role,
      }
    : null;

  return {
    id: doc._id.toString(),
    score: doc.score,
    level: doc.level,
    status: doc.status,
    breakdown: doc.breakdown,
    lostItem: isProjectableItem(doc.lostItemId)
      ? toPublicItem(doc.lostItemId)
      : null,
    foundItem: isProjectableItem(doc.foundItemId)
      ? toPublicItem(doc.foundItemId)
      : null,
    reviewedBy: reviewer,
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function loadMatchById(
  id: string,
  session?: ClientSession,
): Promise<SerializedMatch> {
  const query = ItemMatch.findById(id)
    .populate(LOST_ITEM_POPULATE)
    .populate(FOUND_ITEM_POPULATE)
    .populate(REVIEWER_POPULATE);

  if (session) {
    query.session(session);
  }

  const doc = await query.lean<PopulatedMatch | null>();

  if (!doc) {
    throw ApiError.notFound('Match suggestion not found');
  }

  return serializeMatch(doc);
}

export async function listMatches(
  query: ListMatchesQuery,
): Promise<{
  data: SerializedMatch[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IItemMatch> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.itemId) {
    const itemId = new Types.ObjectId(query.itemId);
    filter.$or = [{ lostItemId: itemId }, { foundItemId: itemId }];
  }

  const [documents, total] = await Promise.all([
    ItemMatch.find(filter)
      .populate(LOST_ITEM_POPULATE)
      .populate(FOUND_ITEM_POPULATE)
      .populate(REVIEWER_POPULATE)
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PopulatedMatch[]>(),
    ItemMatch.countDocuments(filter),
  ]);

  return paginate(documents.map(serializeMatch), page, limit, total);
}

async function dismissMatch(
  actor: MatchActor,
  id: string,
): Promise<SerializedMatch> {
  const match = await ItemMatch.findById(id);

  if (!match) {
    throw ApiError.notFound('Match suggestion not found');
  }

  if (match.status !== 'SUGGESTED') {
    throw ApiError.conflict('Only suggested matches can be reviewed');
  }

  match.status = 'DISMISSED';
  match.reviewedBy = new Types.ObjectId(actor.id);
  match.reviewedAt = new Date();
  await match.save();

  await logActivity({
    actorId: actor.id,
    action: 'MATCH_DISMISSED',
    entityType: 'ItemMatch',
    entityId: match._id,
    description: 'Dismissed a lost and found match suggestion',
    metadata: { lostItemId: match.lostItemId.toString(), foundItemId: match.foundItemId.toString() },
  });

  return loadMatchById(id);
}

async function confirmMatch(
  actor: MatchActor,
  id: string,
): Promise<SerializedMatch> {
  return withTransaction(async (session) => {
    const match = await ItemMatch.findById(id).session(session);

    if (!match) {
      throw ApiError.notFound('Match suggestion not found');
    }

    if (match.status !== 'SUGGESTED') {
      throw ApiError.conflict('Only suggested matches can be reviewed');
    }

    const [lost, found] = await Promise.all([
      LostFoundItem.findById(match.lostItemId).session(session),
      LostFoundItem.findById(match.foundItemId).session(session),
    ]);

    if (!lost || !found) {
      throw ApiError.notFound('One of the matched items no longer exists');
    }

    assertItemTransition(lost.status, 'MATCH_CONFIRMED', 'LOST_FOUND_OFFICER');
    assertItemTransition(found.status, 'MATCH_CONFIRMED', 'LOST_FOUND_OFFICER');

    lost.status = 'MATCH_CONFIRMED';
    found.status = 'MATCH_CONFIRMED';
    await lost.save({ session });
    await found.save({ session });

    match.status = 'CONFIRMED';
    match.reviewedBy = new Types.ObjectId(actor.id);
    match.reviewedAt = new Date();
    await match.save({ session });

    await notify(
      [lost.reporterId],
      {
        type: 'MATCH_CONFIRMED',
        title: 'Possible match confirmed',
        message: `A found item matching your lost report ${lost.reportNumber} was confirmed. Submit a claim to verify ownership.`,
        relatedEntityType: 'ItemMatch',
        relatedEntityId: match._id,
        linkUrl: `/lost-found/claims/new?itemId=${found._id.toString()}&linkedLostItemId=${lost._id.toString()}`,
      },
      session,
    );

    await logActivity(
      {
        actorId: actor.id,
        action: 'MATCH_CONFIRMED',
        entityType: 'ItemMatch',
        entityId: match._id,
        description: `Confirmed match between ${lost.reportNumber} and ${found.reportNumber}`,
        metadata: {
          lostItemId: lost._id.toString(),
          foundItemId: found._id.toString(),
          score: match.score,
          level: match.level,
        },
      },
      session,
    );

    return loadMatchById(id, session);
  });
}

export async function reviewMatch(
  actor: MatchActor,
  id: string,
  input: ReviewMatchInput,
): Promise<SerializedMatch> {
  return input.action === 'DISMISS'
    ? dismissMatch(actor, id)
    : confirmMatch(actor, id);
}
