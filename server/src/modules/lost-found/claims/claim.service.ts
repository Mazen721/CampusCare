import {
  Types,
  type ClientSession,
  type FilterQuery,
  type HydratedDocument,
} from 'mongoose';
import type { ClaimStatus, ItemStatus, Role } from '../../../config/constants';
import { nextNumber } from '../../../shared/services/counter.service';
import { logActivity } from '../../../shared/services/activityLog.service';
import { notify } from '../../../shared/services/notification.service';
import type { ImageAsset } from '../../../shared/schemas/image.schema';
import { assertClaimTransition } from '../../../shared/state-machines/claim.sm';
import { assertItemTransition } from '../../../shared/state-machines/item.sm';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { withTransaction } from '../../../shared/utils/withTransaction';
import { User } from '../../auth/user.model';
import {
  LostFoundItem,
  type ILostFoundItem,
} from '../items/lostFoundItem.model';
import {
  toPublicItem,
  type ProjectableItem,
  type PublicItem,
} from '../items/item.projection';
import { ClaimRequest, type IClaimRequest } from './claimRequest.model';
import type {
  CreateClaimInput,
  HandoverClaimInput,
  ListClaimsQuery,
  ReviewClaimInput,
} from './claim.validation';

export interface ClaimActor {
  id: string;
  role: Role;
}

type ClaimDocument = HydratedDocument<IClaimRequest>;
type ItemDocument = HydratedDocument<ILostFoundItem>;

interface PopulatedPerson {
  _id: Types.ObjectId;
  name: string;
  nameAr?: string;
  email?: string;
  department?: string;
  departmentAr?: string;
  role?: Role;
}

interface PopulatedHandover {
  receivedByName?: string;
  receivedByNameAr?: string;
  handedOverBy?: Types.ObjectId | PopulatedPerson | null;
  notes?: string;
  notesAr?: string;
  handedOverAt?: Date;
}

interface PopulatedClaim {
  _id: Types.ObjectId;
  claimNumber: string;
  itemId?: (ProjectableItem & { privateIdentificationDetails?: string }) | null;
  linkedLostItemId?: ProjectableItem | null;
  claimantId?: Types.ObjectId | PopulatedPerson | null;
  claimDescription: string;
  claimDescriptionAr?: string;
  identifyingDetailsProvided: string;
  supportingEvidence?: ImageAsset[];
  status: ClaimStatus;
  verificationNotes?: string;
  verificationNotesAr?: string;
  rejectionReason?: string;
  rejectionReasonAr?: string;
  reviewedBy?: Types.ObjectId | PopulatedPerson | null;
  reviewedAt?: Date;
  handover?: PopulatedHandover;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimItem extends PublicItem {
  privateIdentificationDetails?: string;
}

export interface SerializedClaim {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  item: ClaimItem | null;
  linkedLostItem: PublicItem | null;
  claimant: {
    id: string;
    name: string;
    nameAr?: string;
    email?: string;
    department?: string;
    departmentAr?: string;
    role?: Role;
  } | null;
  claimDescription: string;
  claimDescriptionAr?: string;
  identifyingDetailsProvided: string;
  supportingEvidence: ImageAsset[];
  verificationNotes?: string;
  verificationNotesAr?: string;
  rejectionReason?: string;
  rejectionReasonAr?: string;
  reviewedBy: { id: string; name: string; nameAr?: string; role?: Role } | null;
  reviewedAt?: Date;
  handover?: {
    receivedByName?: string;
    receivedByNameAr?: string;
    handedOverBy: { id: string; name: string; nameAr?: string } | null;
    notes?: string;
    notesAr?: string;
    handedOverAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CLAIMABLE_ITEM_STATUSES: readonly ItemStatus[] = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
];

const LINKABLE_LOST_STATUSES: readonly ItemStatus[] = ['OPEN', 'MATCH_CONFIRMED'];

const PUBLIC_ITEM_SELECT =
  'reportNumber reportType itemTitle itemTitleAr description descriptionAr category color colorAr brand brandAr locationDetails locationDetailsAr occurrenceDate images status locationId';

const LOCATION_POPULATE = {
  path: 'locationId',
  select: 'buildingName buildingNameAr floor floorAr room roomAr locationType',
};

function itemPopulate(path: string, includePrivate = false) {
  return {
    path,
    select: includePrivate
      ? `${PUBLIC_ITEM_SELECT} +privateIdentificationDetails`
      : PUBLIC_ITEM_SELECT,
    populate: LOCATION_POPULATE,
  };
}

const CLAIMANT_POPULATE = {
  path: 'claimantId',
  select: 'name nameAr email department departmentAr role',
};

const REVIEWER_POPULATE = {
  path: 'reviewedBy',
  select: 'name nameAr role',
};

const HANDOVER_POPULATE = {
  path: 'handover.handedOverBy',
  select: 'name nameAr',
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

function isPopulatedPerson(value: unknown): value is PopulatedPerson {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'name' in value
  );
}

function personIdOf(
  value: Types.ObjectId | PopulatedPerson | null | undefined,
): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}

function isClaimableItemStatus(status: ItemStatus): boolean {
  return CLAIMABLE_ITEM_STATUSES.includes(status);
}

function isLinkableLostStatus(status: ItemStatus): boolean {
  return LINKABLE_LOST_STATUSES.includes(status);
}

async function loadClaimDocument(
  id: string,
  session?: ClientSession,
): Promise<ClaimDocument> {
  const query = ClaimRequest.findById(id);

  if (session) {
    query.session(session);
  }

  const claim = await query;

  if (!claim) {
    throw ApiError.notFound('Claim request not found', 'claimNotFound');
  }

  return claim;
}

async function loadClaimableFoundItem(
  itemId: string,
  session?: ClientSession,
): Promise<ItemDocument> {
  const query = LostFoundItem.findById(itemId);

  if (session) {
    query.session(session);
  }

  const item = await query;

  if (!item) {
    throw ApiError.notFound('Found item not found', 'itemNotFound');
  }

  if (item.reportType !== 'FOUND') {
    throw ApiError.badRequest('Claims can only be submitted for found items', 'foundItemsOnlyClaimable');
  }

  if (!isClaimableItemStatus(item.status)) {
    throw ApiError.conflict(
      `Claims cannot be submitted while the item is ${item.status}`,
      'itemStatusNotClaimable',
      { status: item.status },
    );
  }

  return item;
}

async function markItemReturned(
  item: ItemDocument | null,
  actorRole: 'LOST_FOUND_OFFICER' | 'SYSTEM',
  session: ClientSession,
): Promise<void> {
  if (!item || item.status === 'RETURNED') return;

  assertItemTransition(item.status, 'RETURNED', actorRole);
  item.status = 'RETURNED';
  await item.save({ session });
}

async function autoRejectCompetingClaims(
  claim: ClaimDocument,
  actorId: string,
  session: ClientSession,
): Promise<number> {
  const competingClaims = await ClaimRequest.find({
    _id: { $ne: claim._id },
    itemId: claim.itemId,
    status: { $in: ['PENDING_REVIEW', 'UNDER_VERIFICATION'] },
  }).session(session);

  for (const competing of competingClaims) {
    assertClaimTransition(competing.status, 'REJECTED', 'SYSTEM');
    competing.status = 'REJECTED';
    competing.rejectionReason =
      'Another claim for this item was approved after verification.';
    competing.reviewedBy = new Types.ObjectId(actorId);
    competing.reviewedAt = new Date();
    await competing.save({ session });

    await notify(
      [competing.claimantId],
      {
        type: 'CLAIM_REJECTED',
        title: 'Claim not approved',
        message: `Your claim ${competing.claimNumber} was rejected because another claim for the item was approved.`,
        titleKey: 'claimNotApproved',
        messageKey: 'claimNotApprovedMsg',
        params: { code: competing.claimNumber },
        relatedEntityType: 'ClaimRequest',
        relatedEntityId: competing._id,
        linkUrl: `/lost-found/claims/${competing._id.toString()}`,
      },
      session,
    );
  }

  return competingClaims.length;
}

async function releaseItemIfUnclaimed(
  item: ItemDocument | null,
  session: ClientSession,
): Promise<void> {
  if (!item || item.status !== 'CLAIM_UNDER_REVIEW') return;

  const activeClaims = await ClaimRequest.countDocuments({
    itemId: item._id,
    status: { $in: ['PENDING_REVIEW', 'UNDER_VERIFICATION', 'APPROVED'] },
  }).session(session);

  if (activeClaims > 0) return;

  assertItemTransition(item.status, 'OPEN', 'SYSTEM');
  item.status = 'OPEN';
  await item.save({ session });
}

function serializeClaimItem(
  item: ProjectableItem & { privateIdentificationDetails?: string },
  includePrivate: boolean,
): ClaimItem {
  const publicItem = toPublicItem(item);

  if (!includePrivate || !item.privateIdentificationDetails) {
    return publicItem;
  }

  return {
    ...publicItem,
    privateIdentificationDetails: item.privateIdentificationDetails,
  };
}

function serializeClaim(
  doc: PopulatedClaim,
  includeOfficerFields: boolean,
): SerializedClaim {
  const claimant = isPopulatedPerson(doc.claimantId)
    ? {
        id: doc.claimantId._id.toString(),
        name: doc.claimantId.name,
        nameAr: doc.claimantId.nameAr,
        email: doc.claimantId.email,
        department: doc.claimantId.department,
        departmentAr: doc.claimantId.departmentAr,
        role: doc.claimantId.role,
      }
    : null;

  const reviewer = isPopulatedPerson(doc.reviewedBy)
    ? {
        id: doc.reviewedBy._id.toString(),
        name: doc.reviewedBy.name,
        nameAr: doc.reviewedBy.nameAr,
        role: doc.reviewedBy.role,
      }
    : null;

  const handover = doc.handover
    ? {
        receivedByName: doc.handover.receivedByName,
        receivedByNameAr: doc.handover.receivedByNameAr,
        handedOverBy: isPopulatedPerson(doc.handover.handedOverBy)
          ? {
              id: doc.handover.handedOverBy._id.toString(),
              name: doc.handover.handedOverBy.name,
              nameAr: doc.handover.handedOverBy.nameAr,
            }
          : null,
        notes: doc.handover.notes,
        notesAr: doc.handover.notesAr,
        handedOverAt: doc.handover.handedOverAt,
      }
    : undefined;

  return {
    id: doc._id.toString(),
    claimNumber: doc.claimNumber,
    status: doc.status,
    item: isProjectableItem(doc.itemId)
      ? serializeClaimItem(doc.itemId, includeOfficerFields)
      : null,
    linkedLostItem: isProjectableItem(doc.linkedLostItemId)
      ? toPublicItem(doc.linkedLostItemId)
      : null,
    claimant,
    claimDescription: doc.claimDescription,
    claimDescriptionAr: doc.claimDescriptionAr,
    identifyingDetailsProvided: doc.identifyingDetailsProvided,
    supportingEvidence: doc.supportingEvidence ?? [],
    ...(includeOfficerFields
      ? {
          verificationNotes: doc.verificationNotes,
          verificationNotesAr: doc.verificationNotesAr,
        }
      : {}),
    rejectionReason: doc.rejectionReason,
    rejectionReasonAr: doc.rejectionReasonAr,
    reviewedBy: reviewer,
    reviewedAt: doc.reviewedAt,
    handover,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function assertClaimModuleRole(actor: ClaimActor): void {
  if (actor.role !== 'LOST_FOUND_OFFICER' && actor.role !== 'STUDENT_EMPLOYEE') {
    throw ApiError.forbidden('You do not have access to claim requests', 'claimsAccessForbidden');
  }
}

async function loadClaimById(
  id: string,
  actor: ClaimActor,
  session?: ClientSession,
): Promise<SerializedClaim> {
  assertClaimModuleRole(actor);
  const includeOfficerFields = actor.role === 'LOST_FOUND_OFFICER';

  const query = ClaimRequest.findById(id)
    .populate(itemPopulate('itemId', includeOfficerFields))
    .populate(itemPopulate('linkedLostItemId'))
    .populate(CLAIMANT_POPULATE)
    .populate(REVIEWER_POPULATE)
    .populate(HANDOVER_POPULATE);

  if (session) {
    query.session(session);
  }

  const doc = await query.lean<PopulatedClaim | null>();

  if (!doc) {
    throw ApiError.notFound('Claim request not found', 'claimNotFound');
  }

  if (!includeOfficerFields && personIdOf(doc.claimantId) !== actor.id) {
    throw ApiError.forbidden('You do not have access to this claim', 'claimAccessForbidden');
  }

  return serializeClaim(doc, includeOfficerFields);
}

export async function createClaim(
  actor: ClaimActor,
  input: CreateClaimInput,
  images: ImageAsset[],
): Promise<SerializedClaim> {
  if (actor.role !== 'STUDENT_EMPLOYEE') {
    throw ApiError.forbidden(
      'Only students and employees can submit claims',
      'claimsStudentsEmployeesOnly',
    );
  }

  const found = await loadClaimableFoundItem(input.itemId);

  const existingClaim = await ClaimRequest.exists({
    itemId: found._id,
    claimantId: new Types.ObjectId(actor.id),
    status: { $nin: ['REJECTED', 'COMPLETED'] },
  });

  if (existingClaim) {
    throw ApiError.conflict('You already have an active claim for this item', 'claimAlreadyActive');
  }

  let linkedLostItemId: Types.ObjectId | undefined;

  if (input.linkedLostItemId) {
    const linkedLost = await LostFoundItem.findById(input.linkedLostItemId);
    const isOwnLostReport =
      linkedLost &&
      linkedLost.reportType === 'LOST' &&
      linkedLost.reporterId.toString() === actor.id;

    if (!linkedLost || !isOwnLostReport) {
      throw ApiError.badRequest(
        'Linked lost report must be one of your own lost reports',
        'linkedLostMustBeOwn',
      );
    }

    if (!isLinkableLostStatus(linkedLost.status)) {
      throw ApiError.conflict('The linked lost report is no longer open', 'linkedLostNotOpen');
    }

    linkedLostItemId = linkedLost._id;
  }

  return withTransaction(async (session) => {
    const item = await loadClaimableFoundItem(input.itemId, session);

    const claimNumber = await nextNumber('CLM', session);

    const [claim] = await ClaimRequest.create(
      [
        {
          claimNumber,
          itemId: item._id,
          linkedLostItemId,
          claimantId: new Types.ObjectId(actor.id),
          claimDescription: input.claimDescription,
          identifyingDetailsProvided: input.identifyingDetailsProvided,
          supportingEvidence: images,
          status: 'PENDING_REVIEW',
        },
      ],
      { session },
    );

    if (!claim) {
      throw new Error('Unable to create the claim request');
    }

    if (item.status !== 'CLAIM_UNDER_REVIEW') {
      assertItemTransition(item.status, 'CLAIM_UNDER_REVIEW', 'SYSTEM');
      item.status = 'CLAIM_UNDER_REVIEW';
      await item.save({ session });
    }

    const officers = await User.find({
      role: 'LOST_FOUND_OFFICER',
      isActive: true,
    })
      .select('_id')
      .session(session);

    await notify(
      officers.map((officer) => officer._id),
      {
        type: 'CLAIM_SUBMITTED',
        title: 'New claim submitted',
        message: `Claim ${claimNumber} was submitted for found item ${item.reportNumber}.`,
        titleKey: 'claimSubmitted',
        messageKey: 'claimSubmittedMsg',
        params: { code: claimNumber, itemCode: item.reportNumber },
        relatedEntityType: 'ClaimRequest',
        relatedEntityId: claim._id,
        linkUrl: `/lost-found/claims/${claim._id.toString()}`,
      },
      session,
    );

    await logActivity(
      {
        actorId: actor.id,
        action: 'CLAIM_SUBMITTED',
        entityType: 'ClaimRequest',
        entityId: claim._id,
        description: `Submitted claim ${claimNumber} for ${item.reportNumber}`,
        descriptionKey: 'claimSubmitted',
        params: { code: claimNumber, itemCode: item.reportNumber },
        metadata: {
          itemId: item._id.toString(),
          linkedLostItemId: linkedLostItemId?.toString(),
          images: images.length,
        },
      },
      session,
    );

    return loadClaimById(claim._id.toString(), actor, session);
  });
}

export async function listClaims(
  actor: ClaimActor,
  query: ListClaimsQuery,
): Promise<{
  data: SerializedClaim[];
  page: number;
  limit: number;
  total: number;
}> {
  assertClaimModuleRole(actor);
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IClaimRequest> = {};
  const includeOfficerFields = actor.role === 'LOST_FOUND_OFFICER';

  if (!includeOfficerFields) {
    filter.claimantId = new Types.ObjectId(actor.id);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.itemId) {
    filter.itemId = new Types.ObjectId(query.itemId);
  }

  const [documents, total] = await Promise.all([
    ClaimRequest.find(filter)
      .populate(itemPopulate('itemId', includeOfficerFields))
      .populate(itemPopulate('linkedLostItemId'))
      .populate(CLAIMANT_POPULATE)
      .populate(REVIEWER_POPULATE)
      .populate(HANDOVER_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PopulatedClaim[]>(),
    ClaimRequest.countDocuments(filter),
  ]);

  return paginate(
    documents.map((doc) => serializeClaim(doc, includeOfficerFields)),
    page,
    limit,
    total,
  );
}

export async function getClaim(
  actor: ClaimActor,
  id: string,
): Promise<SerializedClaim> {
  return loadClaimById(id, actor);
}

async function startVerification(
  actor: ClaimActor,
  id: string,
  input: ReviewClaimInput,
): Promise<SerializedClaim> {
  const claim = await loadClaimDocument(id);

  assertClaimTransition(
    claim.status,
    'UNDER_VERIFICATION',
    'LOST_FOUND_OFFICER',
  );

  claim.status = 'UNDER_VERIFICATION';
  if (input.notes) claim.verificationNotes = input.notes;
  claim.reviewedBy = new Types.ObjectId(actor.id);
  claim.reviewedAt = new Date();
  await claim.save();

  await logActivity({
    actorId: actor.id,
    action: 'CLAIM_VERIFICATION_STARTED',
    entityType: 'ClaimRequest',
    entityId: claim._id,
    description: `Started verification for claim ${claim.claimNumber}`,
    descriptionKey: 'claimVerificationStarted',
    params: { code: claim.claimNumber },
  });

  return loadClaimById(id, actor);
}

async function approveClaim(
  actor: ClaimActor,
  id: string,
  input: ReviewClaimInput,
): Promise<SerializedClaim> {
  return withTransaction(async (session) => {
    const claim = await loadClaimDocument(id, session);

    assertClaimTransition(claim.status, 'APPROVED', 'LOST_FOUND_OFFICER');

    const item = await LostFoundItem.findById(claim.itemId).session(session);

    if (!item) {
      throw ApiError.notFound('Found item not found', 'itemNotFound');
    }

    assertItemTransition(
      item.status,
      'APPROVED_FOR_HANDOVER',
      'LOST_FOUND_OFFICER',
    );

    item.status = 'APPROVED_FOR_HANDOVER';
    await item.save({ session });

    claim.status = 'APPROVED';
    if (input.notes) claim.verificationNotes = input.notes;
    claim.reviewedBy = new Types.ObjectId(actor.id);
    claim.reviewedAt = new Date();
    await claim.save({ session });

    const autoRejectedClaims = await autoRejectCompetingClaims(
      claim,
      actor.id,
      session,
    );

    await notify(
      [claim.claimantId],
      {
        type: 'CLAIM_APPROVED',
        title: 'Claim approved',
        message: `Your claim ${claim.claimNumber} was approved. Contact the Lost & Found Office to arrange the handover.`,
        titleKey: 'claimApproved',
        messageKey: 'claimApprovedMsg',
        params: { code: claim.claimNumber },
        relatedEntityType: 'ClaimRequest',
        relatedEntityId: claim._id,
        linkUrl: `/lost-found/claims/${claim._id.toString()}`,
      },
      session,
    );

    await logActivity(
      {
        actorId: actor.id,
        action: 'CLAIM_APPROVED',
        entityType: 'ClaimRequest',
        entityId: claim._id,
        description: `Approved claim ${claim.claimNumber} for ${item.reportNumber}`,
        descriptionKey: 'claimApproved',
        params: { code: claim.claimNumber, itemCode: item.reportNumber },
        metadata: {
          itemId: item._id.toString(),
          autoRejectedClaims,
        },
      },
      session,
    );

    return loadClaimById(id, actor, session);
  });
}

async function rejectClaim(
  actor: ClaimActor,
  id: string,
  input: ReviewClaimInput,
): Promise<SerializedClaim> {
  const reason = input.rejectionReason?.trim() || input.notes?.trim();

  if (!reason) {
    throw ApiError.badRequest('A rejection reason is required', 'rejectionReasonRequired');
  }

  return withTransaction(async (session) => {
    const claim = await loadClaimDocument(id, session);

    assertClaimTransition(claim.status, 'REJECTED', 'LOST_FOUND_OFFICER');

    claim.status = 'REJECTED';
    claim.rejectionReason = reason;
    if (input.rejectionReason && input.notes) {
      claim.verificationNotes = input.notes;
    }
    claim.reviewedBy = new Types.ObjectId(actor.id);
    claim.reviewedAt = new Date();
    await claim.save({ session });

    const item = await LostFoundItem.findById(claim.itemId).session(session);
    await releaseItemIfUnclaimed(item, session);

    await notify(
      [claim.claimantId],
      {
        type: 'CLAIM_REJECTED',
        title: 'Claim rejected',
        message: `Your claim ${claim.claimNumber} was rejected: ${reason}`,
        titleKey: 'claimRejected',
        messageKey: 'claimRejectedMsg',
        params: { code: claim.claimNumber, reason },
        relatedEntityType: 'ClaimRequest',
        relatedEntityId: claim._id,
        linkUrl: `/lost-found/claims/${claim._id.toString()}`,
      },
      session,
    );

    await logActivity(
      {
        actorId: actor.id,
        action: 'CLAIM_REJECTED',
        entityType: 'ClaimRequest',
        entityId: claim._id,
        description: `Rejected claim ${claim.claimNumber}: ${reason}`,
        descriptionKey: 'claimRejected',
        params: { code: claim.claimNumber, reason },
        metadata: { itemId: claim.itemId.toString(), rejectionReason: reason },
      },
      session,
    );

    return loadClaimById(id, actor, session);
  });
}

export async function reviewClaim(
  actor: ClaimActor,
  id: string,
  input: ReviewClaimInput,
): Promise<SerializedClaim> {
  switch (input.action) {
    case 'START_VERIFICATION':
      return startVerification(actor, id, input);
    case 'APPROVE':
      return approveClaim(actor, id, input);
    case 'REJECT':
      return rejectClaim(actor, id, input);
    default:
      throw ApiError.badRequest('Unsupported claim review action', 'unsupportedClaimAction');
  }
}

export async function recordHandover(
  actor: ClaimActor,
  id: string,
  input: HandoverClaimInput,
): Promise<SerializedClaim> {
  return withTransaction(async (session) => {
    const claim = await loadClaimDocument(id, session);

    if (claim.status !== 'APPROVED') {
      throw ApiError.conflict('Only approved claims can be handed over', 'approvedClaimsOnlyHandover');
    }

    assertClaimTransition(claim.status, 'COMPLETED', 'LOST_FOUND_OFFICER');

    claim.status = 'COMPLETED';
    claim.handover = {
      receivedByName: input.receivedByName,
      handedOverBy: new Types.ObjectId(actor.id),
      notes: input.notes,
      handedOverAt: new Date(),
    };
    await claim.save({ session });

    const foundItem = await LostFoundItem.findById(claim.itemId).session(session);
    await markItemReturned(foundItem, 'LOST_FOUND_OFFICER', session);

    if (claim.linkedLostItemId) {
      const lostItem = await LostFoundItem.findById(
        claim.linkedLostItemId,
      ).session(session);

      if (lostItem && lostItem.status !== 'CLOSED') {
        await markItemReturned(lostItem, 'SYSTEM', session);
      }
    }

    await notify(
      [claim.claimantId],
      {
        type: 'HANDOVER_COMPLETED',
        title: 'Item handover recorded',
        message: `Claim ${claim.claimNumber} was completed. The item was handed to ${input.receivedByName}.`,
        titleKey: 'handoverCompleted',
        messageKey: 'handoverCompletedMsg',
        params: { code: claim.claimNumber, name: input.receivedByName },
        relatedEntityType: 'ClaimRequest',
        relatedEntityId: claim._id,
        linkUrl: `/lost-found/claims/${claim._id.toString()}`,
      },
      session,
    );

    await logActivity(
      {
        actorId: actor.id,
        action: 'HANDOVER_COMPLETED',
        entityType: 'ClaimRequest',
        entityId: claim._id,
        description: `Recorded handover for claim ${claim.claimNumber} to ${input.receivedByName}`,
        descriptionKey: 'handoverCompleted',
        params: { code: claim.claimNumber, name: input.receivedByName },
        metadata: {
          itemId: claim.itemId.toString(),
          linkedLostItemId: claim.linkedLostItemId?.toString(),
          notes: input.notes,
        },
      },
      session,
    );

    return loadClaimById(id, actor, session);
  });
}
