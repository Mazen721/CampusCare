import { Types, type FilterQuery } from 'mongoose';
import type { MaintenanceCategory, Priority, Role, SourceType, WorkOrderStatus } from '../../../config/constants';
import { assertWorkOrderTransition } from '../../../shared/state-machines/workOrder.sm';
import { assertTransition as assertRequestTransition } from '../../../shared/state-machines/request.sm';
import { logActivity } from '../../../shared/services/activityLog.service';
import { notify } from '../../../shared/services/notification.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { withTransaction } from '../../../shared/utils/withTransaction';
import { User } from '../../auth/user.model';
import { MaintenanceRequest } from '../requests/maintenanceRequest.model';
import { WorkOrder, type IWorkOrder, type TechnicianNote } from './workOrder.model';
import type {
  AddNoteInput,
  AssignWorkOrderInput,
  CancelWorkOrderInput,
  CompleteWorkOrderInput,
  ListWorkOrdersQuery,
} from './workOrder.validation';

export interface WorkOrderActor {
  id: string;
  role: Role;
}

export interface SerializedTechnicianNote {
  note: string;
  author: {
    id: string;
    name: string;
    role?: string;
  };
  createdAt: Date;
  isSystem: boolean;
}

export interface SerializedWorkOrder {
  id: string;
  workOrderNumber: string;
  sourceType: SourceType;
  maintenanceRequestId?: string;
  preventivePlanId?: string;
  assignedTechnician?: {
    id: string;
    name: string;
    email: string;
    availability?: string;
    specializations?: string[];
  } | null;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  location: {
    id: string;
    buildingName: string;
    floor: string;
    room: string;
    locationType?: string;
  } | null;
  status: WorkOrderStatus;
  aiSummary?: {
    text: string;
    generatedAt: Date;
  };
  scheduledStart?: Date;
  expectedCompletion?: Date;
  actualStart?: Date;
  completedAt?: Date;
  technicianNotes: SerializedTechnicianNote[];
  resolutionDetails?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

function serializeWorkOrder(wo: any): SerializedWorkOrder {
  const tech = wo.assignedTechnicianId;
  const loc = wo.locationId;

  return {
    id: wo._id.toString(),
    workOrderNumber: wo.workOrderNumber,
    sourceType: wo.sourceType,
    maintenanceRequestId: wo.maintenanceRequestId?._id
      ? wo.maintenanceRequestId._id.toString()
      : wo.maintenanceRequestId?.toString(),
    preventivePlanId: wo.preventivePlanId?.toString(),
    assignedTechnician: tech && tech._id
      ? {
          id: tech._id.toString(),
          name: tech.name,
          email: tech.email,
          availability: tech.availability,
          specializations: tech.specializations,
        }
      : null,
    title: wo.title,
    description: wo.description,
    category: wo.category,
    priority: wo.priority,
    location: loc && loc._id
      ? {
          id: loc._id.toString(),
          buildingName: loc.buildingName,
          floor: loc.floor,
          room: loc.room,
          locationType: loc.locationType,
        }
      : null,
    status: wo.status,
    aiSummary: wo.aiSummary
      ? {
          text: wo.aiSummary.text,
          generatedAt: wo.aiSummary.generatedAt,
        }
      : undefined,
    scheduledStart: wo.scheduledStart,
    expectedCompletion: wo.expectedCompletion,
    actualStart: wo.actualStart,
    completedAt: wo.completedAt,
    technicianNotes: (wo.technicianNotes ?? []).map((n: any) => ({
      note: n.note,
      author: n.authorId && n.authorId._id
        ? {
            id: n.authorId._id.toString(),
            name: n.authorId.name,
            role: n.authorId.role,
          }
        : {
            id: n.authorId?.toString() ?? '',
            name: 'System',
          },
      createdAt: n.createdAt,
      isSystem: Boolean(n.isSystem),
    })),
    resolutionDetails: wo.resolutionDetails,
    cancelReason: wo.cancelReason,
    createdAt: wo.createdAt,
    updatedAt: wo.updatedAt,
  };
}

export async function listWorkOrders(
  actor: WorkOrderActor,
  query: ListWorkOrdersQuery,
): Promise<{
  data: SerializedWorkOrder[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IWorkOrder> = {};

  // Technician ownership rule: technician only sees own work orders
  if (actor.role === 'TECHNICIAN') {
    filter.assignedTechnicianId = new Types.ObjectId(actor.id);
  } else if (query.technicianId) {
    filter.assignedTechnicianId = new Types.ObjectId(query.technicianId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.sourceType) {
    filter.sourceType = query.sourceType;
  }

  const [documents, total] = await Promise.all([
    WorkOrder.find(filter)
      .populate('assignedTechnicianId', 'name email availability specializations')
      .populate('locationId', 'buildingName floor room locationType')
      .populate('technicianNotes.authorId', 'name role')
      .sort({ expectedCompletion: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WorkOrder.countDocuments(filter),
  ]);

  return paginate(documents.map(serializeWorkOrder), page, limit, total);
}

export async function getWorkOrder(
  actor: WorkOrderActor,
  id: string,
): Promise<SerializedWorkOrder> {
  const wo = await WorkOrder.findById(id)
    .populate('assignedTechnicianId', 'name email availability specializations')
    .populate('locationId', 'buildingName floor room locationType')
    .populate('technicianNotes.authorId', 'name role')
    .lean();

  if (!wo) {
    throw ApiError.notFound('Work order not found', 'workOrderNotFound');
  }

  // Ownership rule: Technician can only view work order assigned to them
  if (actor.role === 'TECHNICIAN') {
    const assignedId = wo.assignedTechnicianId
      ? (wo.assignedTechnicianId as any)._id?.toString() ?? (wo.assignedTechnicianId as any).toString()
      : undefined;

    if (assignedId !== actor.id) {
      throw ApiError.forbidden('You do not have access to this work order', 'workOrderForbidden');
    }
  }

  return serializeWorkOrder(wo);
}

export async function assignWorkOrder(
  actor: WorkOrderActor,
  id: string,
  input: AssignWorkOrderInput,
): Promise<SerializedWorkOrder> {
  return withTransaction(async (session) => {
    const wo = await WorkOrder.findById(id).session(session);

    if (!wo) {
      throw ApiError.notFound('Work order not found', 'workOrderNotFound');
    }

    assertWorkOrderTransition(wo.status, 'ASSIGNED', 'MAINTENANCE_MANAGER');

    const technician = await User.findById(input.technicianId).session(session);
    if (!technician || technician.role !== 'TECHNICIAN' || !technician.isActive) {
      throw ApiError.badRequest('Assigned user must be an active technician', 'technicianRequired');
    }

    if (technician.availability === 'OFF_DUTY') {
      throw ApiError.badRequest('Technician is off duty and cannot be assigned', 'technicianOffDuty');
    }

    if (new Date(input.expectedCompletion) <= new Date(input.scheduledStart)) {
      throw ApiError.badRequest(
        'Expected completion date must be after scheduled start date',
        'expectedAfterScheduled',
      );
    }

    const previousTechnicianId = wo.assignedTechnicianId?.toString();
    const isReassignment = Boolean(previousTechnicianId && previousTechnicianId !== technician._id.toString());
    const isReschedule = Boolean(previousTechnicianId && previousTechnicianId === technician._id.toString());

    wo.assignedTechnicianId = technician._id;
    wo.scheduledStart = input.scheduledStart;
    wo.expectedCompletion = input.expectedCompletion;
    wo.status = 'ASSIGNED';

    await wo.save({ session });

    // Notify technicians
    if (isReassignment && previousTechnicianId) {
      // Notify old technician
      await notify(
        [new Types.ObjectId(previousTechnicianId)],
        {
          type: 'WORK_ORDER_REASSIGNED',
          title: 'Work order reassigned',
          message: `Work order ${wo.workOrderNumber} was reassigned to another technician.`,
          titleKey: 'workOrderReassigned',
          messageKey: 'workOrderReassignedMsg',
          params: { code: wo.workOrderNumber },
          relatedEntityType: 'WorkOrder',
          relatedEntityId: wo._id,
          linkUrl: `/work-orders/${wo._id.toString()}`,
        },
        session,
      );

      // Notify new technician
      await notify(
        [technician._id],
        {
          type: 'WORK_ORDER_ASSIGNED',
          title: 'Work order assigned',
          message: `You have been assigned work order ${wo.workOrderNumber}.`,
          titleKey: 'workOrderAssigned',
          messageKey: 'workOrderAssignedMsg',
          params: { code: wo.workOrderNumber },
          relatedEntityType: 'WorkOrder',
          relatedEntityId: wo._id,
          linkUrl: `/work-orders/${wo._id.toString()}`,
        },
        session,
      );

      await logActivity(
        {
          actorId: actor.id,
          action: 'WORK_ORDER_REASSIGNED',
          entityType: 'WorkOrder',
          entityId: wo._id,
          description: `Reassigned work order ${wo.workOrderNumber} to ${technician.name}`,
          descriptionKey: 'workOrderReassigned',
          params: { code: wo.workOrderNumber, name: technician.name },
          metadata: {
            previousTechnicianId,
            newTechnicianId: technician._id.toString(),
            scheduledStart: input.scheduledStart,
            expectedCompletion: input.expectedCompletion,
          },
        },
        session,
      );
    } else {
      await notify(
        [technician._id],
        {
          type: isReschedule ? 'WORK_ORDER_RESCHEDULED' : 'WORK_ORDER_ASSIGNED',
          title: isReschedule ? 'Work order schedule updated' : 'Work order assigned',
          message: isReschedule
            ? `Schedule updated for work order ${wo.workOrderNumber}.`
            : `You have been assigned work order ${wo.workOrderNumber}.`,
          titleKey: isReschedule ? 'workOrderRescheduled' : 'workOrderAssigned',
          messageKey: isReschedule ? 'workOrderRescheduledMsg' : 'workOrderAssignedMsg',
          params: { code: wo.workOrderNumber },
          relatedEntityType: 'WorkOrder',
          relatedEntityId: wo._id,
          linkUrl: `/work-orders/${wo._id.toString()}`,
        },
        session,
      );

      await logActivity(
        {
          actorId: actor.id,
          action: isReschedule ? 'WORK_ORDER_RESCHEDULED' : 'WORK_ORDER_ASSIGNED',
          entityType: 'WorkOrder',
          entityId: wo._id,
          description: `${isReschedule ? 'Rescheduled' : 'Assigned'} work order ${wo.workOrderNumber} to ${technician.name}`,
          descriptionKey: isReschedule ? 'workOrderRescheduled' : 'workOrderAssigned',
          params: { code: wo.workOrderNumber, name: technician.name },
          metadata: {
            technicianId: technician._id.toString(),
            scheduledStart: input.scheduledStart,
            expectedCompletion: input.expectedCompletion,
          },
        },
        session,
      );
    }

    const populated = await WorkOrder.findById(wo._id)
      .session(session)
      .populate('assignedTechnicianId', 'name email availability specializations')
      .populate('locationId', 'buildingName floor room locationType')
      .populate('technicianNotes.authorId', 'name role')
      .lean();

    return serializeWorkOrder(populated);
  });
}

export async function startWorkOrder(
  actor: WorkOrderActor,
  id: string,
): Promise<SerializedWorkOrder> {
  return withTransaction(async (session) => {
    const wo = await WorkOrder.findById(id).session(session);

    if (!wo) {
      throw ApiError.notFound('Work order not found', 'workOrderNotFound');
    }

    if (wo.assignedTechnicianId?.toString() !== actor.id) {
      throw ApiError.forbidden(
        'Only the assigned technician can start this work order',
        'assignedTechnicianOnly',
      );
    }

    assertWorkOrderTransition(wo.status, 'IN_PROGRESS', 'TECHNICIAN');

    wo.status = 'IN_PROGRESS';
    if (!wo.actualStart) {
      wo.actualStart = new Date();
    }

    await wo.save({ session });

    // Sync maintenance request if reactive
    if (wo.maintenanceRequestId) {
      const request = await MaintenanceRequest.findById(wo.maintenanceRequestId).session(session);
      if (request) {
        assertRequestTransition(request.status, 'IN_PROGRESS', 'SYSTEM');
        request.status = 'IN_PROGRESS';
        await request.save({ session });
      }
    }

    await logActivity(
      {
        actorId: actor.id,
        action: 'WORK_ORDER_STARTED',
        entityType: 'WorkOrder',
        entityId: wo._id,
        description: `Technician started work order ${wo.workOrderNumber}`,
        descriptionKey: 'workOrderStarted',
        params: { code: wo.workOrderNumber },
        metadata: { actualStart: wo.actualStart },
      },
      session,
    );

    const populated = await WorkOrder.findById(wo._id)
      .session(session)
      .populate('assignedTechnicianId', 'name email availability specializations')
      .populate('locationId', 'buildingName floor room locationType')
      .populate('technicianNotes.authorId', 'name role')
      .lean();

    return serializeWorkOrder(populated);
  });
}

export async function addTechnicianNote(
  actor: WorkOrderActor,
  id: string,
  input: AddNoteInput,
): Promise<SerializedWorkOrder> {
  const wo = await WorkOrder.findById(id);

  if (!wo) {
    throw ApiError.notFound('Work order not found', 'workOrderNotFound');
  }

  if (actor.role === 'TECHNICIAN' && wo.assignedTechnicianId?.toString() !== actor.id) {
    throw ApiError.forbidden(
      'Only the assigned technician can add notes to this work order',
      'assignedTechnicianOnly',
    );
  }

  wo.technicianNotes.push({
    note: input.note,
    authorId: new Types.ObjectId(actor.id),
    createdAt: new Date(),
    isSystem: false,
  });

  await wo.save();

  await logActivity({
    actorId: actor.id,
    action: 'WORK_ORDER_NOTE_ADDED',
    entityType: 'WorkOrder',
    entityId: wo._id,
    description: `Added note to work order ${wo.workOrderNumber}`,
    descriptionKey: 'workOrderNoteAdded',
    params: { code: wo.workOrderNumber },
  });

  const populated = await WorkOrder.findById(wo._id)
    .populate('assignedTechnicianId', 'name email availability specializations')
    .populate('locationId', 'buildingName floor room locationType')
    .populate('technicianNotes.authorId', 'name role')
    .lean();

  return serializeWorkOrder(populated);
}

export async function completeWorkOrder(
  actor: WorkOrderActor,
  id: string,
  input: CompleteWorkOrderInput,
): Promise<SerializedWorkOrder> {
  return withTransaction(async (session) => {
    const wo = await WorkOrder.findById(id).session(session);

    if (!wo) {
      throw ApiError.notFound('Work order not found', 'workOrderNotFound');
    }

    if (wo.assignedTechnicianId?.toString() !== actor.id) {
      throw ApiError.forbidden(
        'Only the assigned technician can complete this work order',
        'assignedTechnicianOnly',
      );
    }

    assertWorkOrderTransition(wo.status, 'COMPLETED', 'TECHNICIAN');

    wo.status = 'COMPLETED';
    wo.resolutionDetails = input.resolutionDetails;
    wo.completedAt = new Date();

    await wo.save({ session });

    // Sync maintenance request if reactive
    if (wo.maintenanceRequestId) {
      const request = await MaintenanceRequest.findById(wo.maintenanceRequestId).session(session);
      if (request) {
        assertRequestTransition(request.status, 'COMPLETED', 'SYSTEM');
        request.status = 'COMPLETED';
        await request.save({ session });

        // Notify requester that work is complete and ask them to confirm resolution
        await notify(
          [request.requesterId],
          {
            type: 'REQUEST_COMPLETED',
            title: 'Maintenance request completed',
            message: `Work order ${wo.workOrderNumber} was completed. Please review and confirm resolution.`,
            titleKey: 'requestCompleted',
            messageKey: 'requestCompletedMsg',
            params: { workOrderCode: wo.workOrderNumber },
            relatedEntityType: 'MaintenanceRequest',
            relatedEntityId: request._id,
            linkUrl: `/maintenance/requests/${request._id.toString()}`,
          },
          session,
        );
      }
    }

    await logActivity(
      {
        actorId: actor.id,
        action: 'WORK_ORDER_COMPLETED',
        entityType: 'WorkOrder',
        entityId: wo._id,
        description: `Technician completed work order ${wo.workOrderNumber}`,
        descriptionKey: 'workOrderCompleted',
        params: { code: wo.workOrderNumber },
        metadata: {
          completedAt: wo.completedAt,
          resolutionDetails: wo.resolutionDetails,
        },
      },
      session,
    );

    const populated = await WorkOrder.findById(wo._id)
      .session(session)
      .populate('assignedTechnicianId', 'name email availability specializations')
      .populate('locationId', 'buildingName floor room locationType')
      .populate('technicianNotes.authorId', 'name role')
      .lean();

    return serializeWorkOrder(populated);
  });
}

export async function cancelWorkOrder(
  actor: WorkOrderActor,
  id: string,
  input: CancelWorkOrderInput,
): Promise<SerializedWorkOrder> {
  return withTransaction(async (session) => {
    const wo = await WorkOrder.findById(id).session(session);

    if (!wo) {
      throw ApiError.notFound('Work order not found', 'workOrderNotFound');
    }

    assertWorkOrderTransition(wo.status, 'CANCELLED', 'MAINTENANCE_MANAGER');

    wo.status = 'CANCELLED';
    wo.cancelReason = input.reason;

    await wo.save({ session });

    // Sync reactive request back to UNDER_REVIEW
    if (wo.sourceType === 'REACTIVE' && wo.maintenanceRequestId) {
      const request = await MaintenanceRequest.findById(wo.maintenanceRequestId).session(session);
      if (request) {
        assertRequestTransition(request.status, 'UNDER_REVIEW', 'SYSTEM');
        request.status = 'UNDER_REVIEW';
        await request.save({ session });

        // Notify managers that the reactive work order was cancelled
        const managers = await User.find({
          role: 'MAINTENANCE_MANAGER',
          isActive: true,
        })
          .select('_id')
          .session(session);

        await notify(
          managers.map((m) => m._id),
          {
            type: 'WORK_ORDER_CANCELLED',
            title: 'Work order cancelled',
            message: `Work order ${wo.workOrderNumber} was cancelled. Request ${request.requestNumber} is back under review.`,
            titleKey: 'workOrderCancelled',
            messageKey: 'workOrderCancelledMsg',
            params: { workOrderCode: wo.workOrderNumber, code: request.requestNumber },
            relatedEntityType: 'MaintenanceRequest',
            relatedEntityId: request._id,
            linkUrl: `/maintenance/requests/${request._id.toString()}`,
          },
          session,
        );
      }
    }

    await logActivity(
      {
        actorId: actor.id,
        action: 'WORK_ORDER_CANCELLED',
        entityType: 'WorkOrder',
        entityId: wo._id,
        description: `Manager cancelled work order ${wo.workOrderNumber}: ${input.reason}`,
        descriptionKey: 'workOrderCancelled',
        params: { code: wo.workOrderNumber, reason: input.reason },
        metadata: { cancelReason: input.reason },
      },
      session,
    );

    const populated = await WorkOrder.findById(wo._id)
      .session(session)
      .populate('assignedTechnicianId', 'name email availability specializations')
      .populate('locationId', 'buildingName floor room locationType')
      .populate('technicianNotes.authorId', 'name role')
      .lean();

    return serializeWorkOrder(populated);
  });
}
