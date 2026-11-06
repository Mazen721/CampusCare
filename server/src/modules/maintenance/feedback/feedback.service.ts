import { Types, type FilterQuery } from 'mongoose';
import type { Role } from '../../../config/constants';
import { logActivity } from '../../../shared/services/activityLog.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { User } from '../../auth/user.model';
import { MaintenanceRequest } from '../requests/maintenanceRequest.model';
import { WorkOrder } from '../work-orders/workOrder.model';
import { ServiceFeedback, type IServiceFeedback } from './serviceFeedback.model';
import type {
  CreateFeedbackInput,
  ListFeedbackQuery,
} from './feedback.validation';

export interface FeedbackActor {
  id: string;
  role: Role;
}

export interface SerializedFeedback {
  id: string;
  maintenanceRequestId: string;
  requestNumber?: string;
  requestTitle?: string;
  workOrderId: string;
  workOrderNumber?: string;
  technician: {
    id: string;
    name: string;
    email?: string;
    specializations?: string[];
  };
  requester: {
    id: string;
    name: string;
    email?: string;
  };
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface PerTechnicianFeedbackSummary {
  technicianId: string;
  technicianName: string;
  averageRating: number;
  count: number;
}

function serializeFeedback(doc: any): SerializedFeedback {
  const tech = doc.technicianId;
  const requester = doc.requesterId;
  const req = doc.maintenanceRequestId;
  const wo = doc.workOrderId;

  return {
    id: doc._id.toString(),
    maintenanceRequestId: req?._id ? req._id.toString() : doc.maintenanceRequestId.toString(),
    requestNumber: req?.requestNumber,
    requestTitle: req?.title,
    workOrderId: wo?._id ? wo._id.toString() : doc.workOrderId.toString(),
    workOrderNumber: wo?.workOrderNumber,
    technician: {
      id: tech?._id ? tech._id.toString() : doc.technicianId.toString(),
      name: tech?.name ?? 'Unknown Technician',
      email: tech?.email,
      specializations: tech?.specializations,
    },
    requester: {
      id: requester?._id ? requester._id.toString() : doc.requesterId.toString(),
      name: requester?.name ?? 'Requester',
      email: requester?.email,
    },
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt,
  };
}

export async function createFeedback(
  actorId: string,
  input: CreateFeedbackInput,
): Promise<SerializedFeedback> {
  const request = await MaintenanceRequest.findById(input.maintenanceRequestId);

  if (!request) {
    throw ApiError.notFound('Maintenance request not found');
  }

  // Ownership: requester only
  if (request.requesterId.toString() !== actorId) {
    throw ApiError.forbidden('Only the person who submitted the request can leave feedback');
  }

  // Status requirement: CLOSED only
  if (request.status !== 'CLOSED') {
    throw ApiError.badRequest('Feedback can only be submitted after a request is closed');
  }

  // Once per request
  const existing = await ServiceFeedback.findOne({
    maintenanceRequestId: request._id,
  }).select('_id');

  if (existing) {
    throw ApiError.conflict('Feedback has already been submitted for this request');
  }

  // Attribute technician from the linked work order
  let technicianId: Types.ObjectId | undefined;
  let workOrderId: Types.ObjectId | undefined;

  if (request.currentWorkOrderId) {
    const wo = await WorkOrder.findById(request.currentWorkOrderId);
    if (wo) {
      workOrderId = wo._id;
      technicianId = wo.assignedTechnicianId;
    }
  }

  if (!technicianId || !workOrderId) {
    const fallbackWo = await WorkOrder.findOne({
      maintenanceRequestId: request._id,
      assignedTechnicianId: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    if (fallbackWo) {
      workOrderId = fallbackWo._id;
      technicianId = fallbackWo.assignedTechnicianId;
    }
  }

  if (!technicianId || !workOrderId) {
    throw ApiError.badRequest('No assigned technician found for this request');
  }

  const feedback = await ServiceFeedback.create({
    maintenanceRequestId: request._id,
    workOrderId,
    technicianId,
    requesterId: new Types.ObjectId(actorId),
    rating: input.rating,
    comment: input.comment,
  });

  await logActivity({
    actorId,
    action: 'FEEDBACK_SUBMITTED',
    entityType: 'ServiceFeedback',
    entityId: feedback._id,
    description: `Submitted ${input.rating}-star feedback for request ${request.requestNumber}`,
    metadata: {
      rating: input.rating,
      technicianId: technicianId.toString(),
      maintenanceRequestId: request._id.toString(),
    },
  });

  const populated = await ServiceFeedback.findById(feedback._id)
    .populate('technicianId', 'name email specializations')
    .populate('requesterId', 'name email')
    .populate('maintenanceRequestId', 'requestNumber title')
    .populate('workOrderId', 'workOrderNumber')
    .lean();

  return serializeFeedback(populated);
}

export async function listFeedback(
  actor: FeedbackActor,
  query: ListFeedbackQuery,
): Promise<{
  data: SerializedFeedback[];
  page: number;
  limit: number;
  total: number;
  averageRating?: number | null;
  perTechnician?: PerTechnicianFeedbackSummary[];
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IServiceFeedback> = {};

  if (actor.role === 'STUDENT_EMPLOYEE') {
    filter.requesterId = new Types.ObjectId(actor.id);
  } else if (query.technicianId) {
    filter.technicianId = new Types.ObjectId(query.technicianId);
  }

  if (query.maintenanceRequestId) {
    filter.maintenanceRequestId = new Types.ObjectId(query.maintenanceRequestId);
  }

  const [documents, total] = await Promise.all([
    ServiceFeedback.find(filter)
      .populate('technicianId', 'name email specializations')
      .populate('requesterId', 'name email')
      .populate('maintenanceRequestId', 'requestNumber title')
      .populate('workOrderId', 'workOrderNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceFeedback.countDocuments(filter),
  ]);

  const result = paginate(documents.map(serializeFeedback), page, limit, total);

  // If Manager or Admin, compute averages
  if (actor.role === 'MAINTENANCE_MANAGER' || actor.role === 'SUPER_ADMIN') {
    const avgStats = await ServiceFeedback.aggregate<{ _id: null; avg: number }>([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const overallAvg =
      avgStats.length > 0 && avgStats[0] ? Math.round(avgStats[0].avg * 10) / 10 : null;

    const perTechStats = await ServiceFeedback.aggregate<{
      _id: Types.ObjectId;
      avg: number;
      count: number;
    }>([
      { $match: filter },
      { $group: { _id: '$technicianId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const techUsers = await User.find({
      _id: { $in: perTechStats.map((s) => s._id) },
    }).select('name');
    const nameMap = new Map(techUsers.map((u) => [u._id.toString(), u.name]));

    const perTechnician: PerTechnicianFeedbackSummary[] = perTechStats.map((stat) => ({
      technicianId: stat._id.toString(),
      technicianName: nameMap.get(stat._id.toString()) ?? 'Unknown Technician',
      averageRating: Math.round(stat.avg * 10) / 10,
      count: stat.count,
    }));

    return {
      ...result,
      averageRating: overallAvg,
      perTechnician,
    };
  }

  return result;
}
