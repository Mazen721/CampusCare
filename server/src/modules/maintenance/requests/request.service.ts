import { Types, type FilterQuery } from 'mongoose';
import type { RequestStatus, Role } from '../../../config/constants';
import type { ImageAsset } from '../../../shared/schemas/image.schema';
import { assertTransition } from '../../../shared/state-machines/request.sm';
import { assertWorkOrderTransition } from '../../../shared/state-machines/workOrder.sm';
import { logActivity } from '../../../shared/services/activityLog.service';
import { nextNumber } from '../../../shared/services/counter.service';
import { notify } from '../../../shared/services/notification.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { withTransaction } from '../../../shared/utils/withTransaction';
import { User } from '../../auth/user.model';
import { Location } from '../../locations/location.model';
import { WorkOrder, type IWorkOrder } from '../work-orders/workOrder.model';
import {
  MaintenanceRequest,
  type IMaintenanceRequest,
} from './maintenanceRequest.model';
import type {
  CreateRequestInput,
  ListRequestsQuery,
  ReopenRequestInput,
  ReviewRequestInput,
} from './request.validation';

interface PopulatedUserRef {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  department?: string;
  role?: Role;
}

interface PopulatedLocationRef {
  _id: Types.ObjectId;
  buildingName: string;
  floor: string;
  room: string;
  locationType: string;
}

interface PopulatedTechnicianRef {
  _id: Types.ObjectId;
  name: string;
  availability?: string;
}

interface PopulatedWorkOrderRef {
  _id: Types.ObjectId;
  workOrderNumber: string;
  status: IWorkOrder['status'];
  sourceType: IWorkOrder['sourceType'];
  scheduledStart?: Date;
  expectedCompletion?: Date;
  assignedTechnicianId?: PopulatedTechnicianRef | Types.ObjectId | null;
}

export interface RequestWithRefs
  extends Omit<
    IMaintenanceRequest,
    'requesterId' | 'locationId' | 'reviewedBy' | 'currentWorkOrderId'
  > {
  _id: Types.ObjectId;
  requesterId?: PopulatedUserRef | null;
  locationId?: PopulatedLocationRef | null;
  reviewedBy?: PopulatedUserRef | null;
  currentWorkOrderId?: PopulatedWorkOrderRef | null;
}

export interface RequestActor {
  id: string;
  role: Role;
}

export interface SerializedWorkOrderSummary {
  id: string;
  workOrderNumber: string;
  status: IWorkOrder['status'];
  sourceType?: IWorkOrder['sourceType'];
  scheduledStart?: Date;
  expectedCompletion?: Date;
  assignedTechnician?: {
    id: string;
    name: string;
    availability?: string;
  } | null;
}

export interface SerializedRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: IMaintenanceRequest['category'];
  priority: IMaintenanceRequest['priority'];
  status: RequestStatus;
  equipmentDescription?: string;
  attachments: ImageAsset[];
  location: {
    id: string;
    buildingName: string;
    floor: string;
    room: string;
    locationType: string;
  } | null;
  requester: {
    id: string;
    name: string;
    email?: string;
    department?: string;
    role?: Role;
  } | null;
  reviewedBy: {
    id: string;
    name: string;
    role?: Role;
  } | null;
  reviewedAt?: Date;
  reviewNotes?: string;
  currentWorkOrder: SerializedWorkOrderSummary | null;
  reopenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const REQUEST_POPULATION = [
  { path: 'requesterId', select: 'name email department role' },
  { path: 'locationId', select: 'buildingName floor room locationType' },
  { path: 'reviewedBy', select: 'name role' },
  {
    path: 'currentWorkOrderId',
    select: 'workOrderNumber status sourceType scheduledStart expectedCompletion assignedTechnicianId',
    populate: { path: 'assignedTechnicianId', select: 'name availability' },
  },
];

function objectIdOf(
  value: Types.ObjectId | { _id: Types.ObjectId } | null | undefined,
): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}

function serializeTechnician(
  value: PopulatedTechnicianRef | Types.ObjectId | null | undefined,
): SerializedWorkOrderSummary['assignedTechnician'] {
  if (!value || value instanceof Types.ObjectId) return null;

  return {
    id: value._id.toString(),
    name: value.name,
    availability: value.availability,
  };
}

export function serializeWorkOrderSummary(
  workOrder: PopulatedWorkOrderRef,
): SerializedWorkOrderSummary {
  return {
    id: workOrder._id.toString(),
    workOrderNumber: workOrder.workOrderNumber,
    status: workOrder.status,
    sourceType: workOrder.sourceType,
    scheduledStart: workOrder.scheduledStart,
    expectedCompletion: workOrder.expectedCompletion,
    assignedTechnician: serializeTechnician(workOrder.assignedTechnicianId),
  };
}

export function serializeRequest(request: RequestWithRefs): SerializedRequest {
  const location = request.locationId;
  const requester = request.requesterId;
  const reviewer = request.reviewedBy;

  return {
    id: request._id.toString(),
    requestNumber: request.requestNumber,
    title: request.title,
    description: request.description,
    category: request.category,
    priority: request.priority,
    status: request.status,
    equipmentDescription: request.equipmentDescription,
    attachments: request.attachments ?? [],
    location: location
      ? {
          id: location._id.toString(),
          buildingName: location.buildingName,
          floor: location.floor,
          room: location.room,
          locationType: location.locationType,
        }
      : null,
    requester: requester
      ? {
          id: requester._id.toString(),
          name: requester.name,
          email: requester.email,
          department: requester.department,
          role: requester.role,
        }
      : null,
    reviewedBy: reviewer
      ? {
          id: reviewer._id.toString(),
          name: reviewer.name,
          role: reviewer.role,
        }
      : null,
    reviewedAt: request.reviewedAt,
    reviewNotes: request.reviewNotes,
    currentWorkOrder: request.currentWorkOrderId
      ? serializeWorkOrderSummary(request.currentWorkOrderId)
      : null,
    reopenCount: request.reopenCount,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findRequestWithRefs(id: string): Promise<RequestWithRefs | null> {
  return MaintenanceRequest.findById(id)
    .populate(REQUEST_POPULATION)
    .lean<RequestWithRefs>();
}

async function getSerializedRequest(id: string): Promise<SerializedRequest> {
  const request = await findRequestWithRefs(id);

  if (!request) {
    throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
  }

  return serializeRequest(request);
}

export async function createRequest(
  requesterId: string,
  input: CreateRequestInput,
  attachments: ImageAsset[],
): Promise<SerializedRequest> {
  const location = await Location.findOne({
    _id: input.locationId,
    isActive: true,
  }).select('buildingName floor room');

  if (!location) {
    throw ApiError.badRequest('Select an active campus location', 'activeLocationRequired');
  }

  const requestNumber = await nextNumber('MR');
  const request = await MaintenanceRequest.create({
    requestNumber,
    requesterId,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    locationId: input.locationId,
    equipmentDescription: input.equipmentDescription,
    attachments,
    status: 'SUBMITTED',
    reopenCount: 0,
  });

  const managers = await User.find({
    role: 'MAINTENANCE_MANAGER',
    isActive: true,
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  await notify(
    managers.map((manager) => manager._id),
    {
      type: 'REQUEST_SUBMITTED',
      title: 'New maintenance request',
      message: `${request.requestNumber} · ${request.title} · ${location.buildingName}, ${location.floor}, Room ${location.room}`,
      titleKey: 'newRequestSubmitted',
      messageKey: 'newRequestSubmittedMsg',
      params: {
        code: request.requestNumber,
        title: request.title,
        building: { en: location.buildingName },
        floor: { en: location.floor },
        room: { en: location.room },
      },
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: request._id,
      linkUrl: '/maintenance/request-queue',
    },
  );

  await logActivity({
    actorId: requesterId,
    action: 'REQUEST_SUBMITTED',
    entityType: 'MaintenanceRequest',
    entityId: request._id,
    description: `Submitted maintenance request ${request.requestNumber} — ${request.title}`,
    descriptionKey: 'requestSubmitted',
    params: { code: request.requestNumber, title: request.title },
    metadata: {
      category: request.category,
      priority: request.priority,
      locationId: input.locationId,
      attachments: attachments.length,
    },
  });

  return getSerializedRequest(request._id.toString());
}

export async function listRequests(
  actor: RequestActor,
  query: ListRequestsQuery,
): Promise<{
  data: SerializedRequest[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IMaintenanceRequest> = {};

  if (actor.role === 'STUDENT_EMPLOYEE') {
    filter.requesterId = new Types.ObjectId(actor.id);
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    filter.$or = [
      { requestNumber: pattern },
      { title: pattern },
      { description: pattern },
    ];
  }

  const ranked = await MaintenanceRequest.aggregate<{
    ids: Array<{ _id: Types.ObjectId }>;
    total: Array<{ count: number }>;
  }>([
    { $match: filter },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'CRITICAL'] }, then: 0 },
              { case: { $eq: ['$priority', 'HIGH'] }, then: 1 },
              { case: { $eq: ['$priority', 'MEDIUM'] }, then: 2 },
              { case: { $eq: ['$priority', 'LOW'] }, then: 3 },
            ],
            default: 4,
          },
        },
      },
    },
    { $sort: { priorityRank: 1, createdAt: -1 } },
    {
      $facet: {
        ids: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1 } }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const result = ranked[0];
  const orderedIds = result?.ids.map((entry) => entry._id.toString()) ?? [];
  const total = result?.total[0]?.count ?? 0;

  if (orderedIds.length === 0) {
    return paginate<SerializedRequest>([], page, limit, total);
  }

  const documents = await MaintenanceRequest.find({ _id: { $in: orderedIds } })
    .populate(REQUEST_POPULATION)
    .lean<RequestWithRefs[]>();

  const byId = new Map(documents.map((document) => [document._id.toString(), document]));
  const data = orderedIds
    .map((id) => byId.get(id))
    .filter((document): document is RequestWithRefs => Boolean(document))
    .map(serializeRequest);

  return paginate(data, page, limit, total);
}

export async function getRequest(
  actor: RequestActor,
  id: string,
): Promise<SerializedRequest> {
  const request = await findRequestWithRefs(id);

  if (!request) {
    throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
  }

  const requesterId = request.requesterId?._id.toString();
  const isOwner = requesterId === actor.id;
  const isManager = actor.role === 'MAINTENANCE_MANAGER' || actor.role === 'SUPER_ADMIN';
  const assignedTechnicianId = request.currentWorkOrderId
    ? objectIdOf(request.currentWorkOrderId.assignedTechnicianId)
    : undefined;
  const isAssignedTechnician =
    actor.role === 'TECHNICIAN' && assignedTechnicianId === actor.id;

  if (!isOwner && !isManager && !isAssignedTechnician) {
    throw ApiError.forbidden(
      'You do not have access to this maintenance request',
      'requestForbidden',
    );
  }

  return serializeRequest(request);
}

interface ApproveResult {
  workOrder: SerializedWorkOrderSummary;
}

export async function reviewRequest(
  actor: RequestActor,
  id: string,
  input: ReviewRequestInput,
): Promise<{ request: SerializedRequest; workOrder?: SerializedWorkOrderSummary }> {
  const current = await MaintenanceRequest.findById(id);

  if (!current) {
    throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
  }

  if (input.action === 'APPROVE') {
    const result = await withTransaction<ApproveResult>(async (session) => {
      const request = await MaintenanceRequest.findById(id).session(session);

      if (!request) {
        throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
      }

      assertTransition(request.status, 'APPROVED', 'MAINTENANCE_MANAGER');

      const existingWorkOrder = await WorkOrder.findOne({
        maintenanceRequestId: request._id,
        status: { $ne: 'CANCELLED' },
      })
        .select('_id')
        .session(session);

      if (existingWorkOrder) {
        throw ApiError.conflict(
          'This request already has a linked work order. Refusing to create a second one.',
          'requestAlreadyHasWorkOrder',
        );
      }

      const workOrderNumber = await nextNumber('WO', session);
      const createdWorkOrders = await WorkOrder.create(
        [
          {
            workOrderNumber,
            sourceType: 'REACTIVE',
            maintenanceRequestId: request._id,
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            locationId: request.locationId,
            status: 'PENDING_ASSIGNMENT',
            technicianNotes: [],
          },
        ],
        { session },
      );

      const workOrder = createdWorkOrders[0];
      if (!workOrder) {
        throw new Error('Unable to create the work order');
      }

      const updated = await MaintenanceRequest.findOneAndUpdate(
        {
          _id: request._id,
          status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
        {
          $set: {
            status: 'APPROVED',
            reviewedBy: actor.id,
            reviewedAt: new Date(),
            currentWorkOrderId: workOrder._id,
            ...(input.notes ? { reviewNotes: input.notes } : {}),
          },
        },
        { new: true, session },
      );

      if (!updated) {
        throw ApiError.conflict(
          'This request was reviewed by someone else. Refresh and try again.',
          'requestConcurrentReview',
        );
      }

      await notify(
        [request.requesterId],
        {
          type: 'REQUEST_APPROVED',
          title: 'Maintenance request approved',
          message: `${request.requestNumber} was approved. Work order ${workOrder.workOrderNumber} has been created.`,
          titleKey: 'requestApproved',
          messageKey: 'requestApprovedMsg',
          params: { code: request.requestNumber, workOrderCode: workOrder.workOrderNumber },
          relatedEntityType: 'MaintenanceRequest',
          relatedEntityId: request._id,
          linkUrl: `/maintenance/requests/${request._id.toString()}`,
        },
        session,
      );

      await logActivity(
        {
          actorId: actor.id,
          action: 'REQUEST_APPROVED',
          entityType: 'MaintenanceRequest',
          entityId: request._id,
          description: `Approved maintenance request ${request.requestNumber} and created work order ${workOrder.workOrderNumber}`,
          descriptionKey: 'requestApproved',
          params: { code: request.requestNumber, workOrderCode: workOrder.workOrderNumber },
          metadata: {
            workOrderId: workOrder._id.toString(),
            workOrderNumber: workOrder.workOrderNumber,
          },
        },
        session,
      );

      return {
        workOrder: {
          id: workOrder._id.toString(),
          workOrderNumber: workOrder.workOrderNumber,
          status: workOrder.status,
          sourceType: workOrder.sourceType,
        },
      };
    });

    return {
      request: await getSerializedRequest(id),
      workOrder: result.workOrder,
    };
  }

  const targetStatus: RequestStatus =
    input.action === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : 'REJECTED';

  assertTransition(current.status, targetStatus, 'MAINTENANCE_MANAGER');

  const update: Record<string, unknown> = {
    status: targetStatus,
    reviewedBy: actor.id,
    reviewedAt: new Date(),
  };

  if (input.notes) {
    update.reviewNotes = input.notes;
  }

  const updated = await MaintenanceRequest.findOneAndUpdate(
    { _id: current._id, status: current.status },
    { $set: update },
    { new: true },
  );

  if (!updated) {
    throw ApiError.conflict(
      'This request was reviewed by someone else. Refresh and try again.',
      'requestConcurrentReview',
    );
  }

  const isReject = targetStatus === 'REJECTED';
  await notify(
    [current.requesterId],
    {
      type: isReject ? 'REQUEST_REJECTED' : 'REQUEST_UNDER_REVIEW',
      title: isReject ? 'Maintenance request rejected' : 'Maintenance request under review',
      message: isReject
        ? `${current.requestNumber} was rejected. Reason: ${input.notes ?? 'No notes provided'}`
        : `${current.requestNumber} is now under review.`,
      titleKey: isReject ? 'requestRejected' : 'requestUnderReview',
      messageKey: isReject
        ? (input.notes ? 'requestRejectedWithReason' : 'requestRejectedMsg')
        : 'requestUnderReviewMsg',
      params: { code: current.requestNumber, reason: input.notes ?? '' },
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: current._id,
      linkUrl: `/maintenance/requests/${current._id.toString()}`,
    },
  );

  await logActivity({
    actorId: actor.id,
    action: isReject ? 'REQUEST_REJECTED' : 'REQUEST_UNDER_REVIEW',
    entityType: 'MaintenanceRequest',
    entityId: current._id,
    description: isReject
      ? `Rejected maintenance request ${current.requestNumber}`
      : `Moved maintenance request ${current.requestNumber} under review`,
    descriptionKey: isReject ? 'requestRejected' : 'requestUnderReview',
    params: { code: current.requestNumber },
    metadata: { notes: input.notes },
  });

  return { request: await getSerializedRequest(id) };
}

export async function confirmRequest(
  actor: RequestActor,
  id: string,
): Promise<SerializedRequest> {
  const request = await MaintenanceRequest.findById(id);

  if (!request) {
    throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
  }

  const requesterId = request.requesterId.toString();
  const isOwner = requesterId === actor.id;
  const isManager = actor.role === 'MAINTENANCE_MANAGER' || actor.role === 'SUPER_ADMIN';

  if (!isOwner && !isManager) {
    throw ApiError.forbidden(
      'Only the requester or a manager can confirm this request',
      'requestConfirmForbidden',
    );
  }

  if (request.status === 'COMPLETED') {
    assertTransition('COMPLETED', 'CLOSED', isOwner ? 'OWNER' : 'MAINTENANCE_MANAGER');
  } else if (request.status === 'REOPENED') {
    if (!isManager) {
      throw ApiError.forbidden(
        'Only a manager can close a reopened request',
        'reopenedRequestCloseForbidden',
      );
    }
    assertTransition('REOPENED', 'CLOSED', 'MAINTENANCE_MANAGER');
  } else {
    assertTransition(request.status, 'CLOSED', isOwner ? 'OWNER' : 'MAINTENANCE_MANAGER');
  }

  request.status = 'CLOSED';
  await request.save();

  await logActivity({
    actorId: actor.id,
    action: isOwner ? 'REQUEST_CONFIRMED' : 'REQUEST_CLOSED',
    entityType: 'MaintenanceRequest',
    entityId: request._id,
    description: isOwner
      ? `Requester confirmed resolution of request ${request.requestNumber}`
      : `Manager closed request ${request.requestNumber}`,
    descriptionKey: isOwner ? 'requestConfirmed' : 'requestClosed',
    params: { code: request.requestNumber },
  });

  return getSerializedRequest(id);
}

export async function reopenRequest(
  actor: RequestActor,
  id: string,
  input: ReopenRequestInput,
): Promise<SerializedRequest> {
  await withTransaction(async (session) => {
    const request = await MaintenanceRequest.findById(id).session(session);

    if (!request) {
      throw ApiError.notFound('Maintenance request not found', 'requestNotFound');
    }

    const requesterId = request.requesterId.toString();
    const isOwner = requesterId === actor.id;
    const isManager = actor.role === 'MAINTENANCE_MANAGER' || actor.role === 'SUPER_ADMIN';

    if (!isOwner && !isManager) {
      throw ApiError.forbidden(
        'Only the requester or a manager can reopen this request',
        'requestReopenForbidden',
      );
    }

    assertTransition(request.status, 'REOPENED', isOwner ? 'OWNER' : 'MAINTENANCE_MANAGER');

    if (!request.currentWorkOrderId) {
      throw ApiError.badRequest(
        'No work order is linked to this maintenance request',
        'noLinkedWorkOrder',
      );
    }

    const wo = await WorkOrder.findById(request.currentWorkOrderId).session(session);
    if (!wo) {
      throw ApiError.notFound('Linked work order not found', 'workOrderNotFound');
    }

    assertWorkOrderTransition(wo.status, 'ASSIGNED', 'SYSTEM');

    if (wo.resolutionDetails) {
      wo.technicianNotes.push({
        note: `Previous resolution (reopened #${(request.reopenCount ?? 0) + 1}: ${input.reason}): ${wo.resolutionDetails}`,
        authorId: new Types.ObjectId(actor.id),
        createdAt: new Date(),
        isSystem: true,
      });
    }

    wo.completedAt = undefined;
    wo.resolutionDetails = undefined;
    wo.status = 'ASSIGNED';
    await wo.save({ session });

    request.reopenCount = (request.reopenCount ?? 0) + 1;
    request.status = 'REOPENED';
    await request.save({ session });

    if (wo.assignedTechnicianId) {
      await notify(
        [wo.assignedTechnicianId],
        {
          type: 'REQUEST_REOPENED',
          title: 'Work order reopened',
          message: `Request ${request.requestNumber} was reopened: ${input.reason}. Work order ${wo.workOrderNumber} is back in your assigned queue.`,
          titleKey: 'workOrderReopened',
          messageKey: 'workOrderReopenedMsg',
          params: {
            code: request.requestNumber,
            workOrderCode: wo.workOrderNumber,
            reason: input.reason,
          },
          relatedEntityType: 'WorkOrder',
          relatedEntityId: wo._id,
          linkUrl: `/work-orders/${wo._id.toString()}`,
        },
        session,
      );
    }

    await logActivity(
      {
        actorId: actor.id,
        action: 'REQUEST_REOPENED',
        entityType: 'MaintenanceRequest',
        entityId: request._id,
        description: `Reopened request ${request.requestNumber}: ${input.reason}`,
        descriptionKey: 'requestReopened',
        params: { code: request.requestNumber, reason: input.reason },
        metadata: {
          reason: input.reason,
          reopenCount: request.reopenCount,
          workOrderId: wo._id.toString(),
        },
      },
      session,
    );

    return { success: true };
  });

  return getSerializedRequest(id);
}
