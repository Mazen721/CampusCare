import { Types } from 'mongoose';
import type { MaintenanceCategory, TechnicianAvailability } from '../../../config/constants';
import { logActivity } from '../../../shared/services/activityLog.service';
import { ApiError } from '../../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../../shared/utils/paginate';
import { hashPassword, toSafeUser, type SafeUser } from '../../auth/auth.service';
import { User, type UserDocument } from '../../auth/user.model';
import { WorkOrder, type IWorkOrder } from '../work-orders/workOrder.model';
import { ServiceFeedback } from '../feedback/serviceFeedback.model';
import type {
  CreateTechnicianInput,
  ListTechniciansQuery,
  UpdateTechnicianInput,
} from './technician.validation';

export interface TechnicianStats {
  activeWorkOrderCount: number;
  completedWorkOrderCount: number;
  averageRating: number | null;
  averageResolutionHours: number | null;
}

export interface TechnicianSummary extends SafeUser, TechnicianStats {
  matchesCategory?: boolean;
}

export interface TechnicianActiveTask {
  id: string;
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  priority: string;
  status: string;
  category: string;
  scheduledStart?: Date;
  expectedCompletion?: Date;
  actualStart?: Date;
  location?: {
    id: string;
    buildingName: string;
    buildingNameAr?: string;
    floor: string;
    floorAr?: string;
    room: string;
    roomAr?: string;
  } | null;
}

export interface TechnicianDetail extends SafeUser, TechnicianStats {
  activeTasks: TechnicianActiveTask[];
}

const AVAILABILITY_ORDER: Record<TechnicianAvailability, number> = {
  AVAILABLE: 0,
  BUSY: 1,
  OFF_DUTY: 2,
};

async function assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
  const existing = await User.findOne({
    email: email.toLowerCase().trim(),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('_id');

  if (existing) {
    throw ApiError.conflict(
      'An account with this email address already exists',
      'emailAlreadyExists',
    );
  }
}

export async function listTechnicians(query: ListTechniciansQuery): Promise<{
  data: TechnicianSummary[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query, { limit: 50 });

  // 1. Fetch all technicians
  const technicians = await User.find({ role: 'TECHNICIAN' });
  const techIds = technicians.map((t) => t._id);

  if (techIds.length === 0) {
    return paginate([], page, limit, 0);
  }

  // 2. Aggregate active work order counts
  const activeWOs = await WorkOrder.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        assignedTechnicianId: { $in: techIds },
        status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    },
    {
      $group: {
        _id: '$assignedTechnicianId',
        count: { $sum: 1 },
      },
    },
  ]);
  const activeCountMap = new Map<string, number>(
    activeWOs.map((entry) => [entry._id.toString(), entry.count]),
  );

  // 3. Aggregate completed work order counts
  const completedWOs = await WorkOrder.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        assignedTechnicianId: { $in: techIds },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: '$assignedTechnicianId',
        count: { $sum: 1 },
      },
    },
  ]);
  const completedCountMap = new Map<string, number>(
    completedWOs.map((entry) => [entry._id.toString(), entry.count]),
  );

  // 4. Aggregate average rating from ServiceFeedback
  const ratings = await ServiceFeedback.aggregate<{ _id: Types.ObjectId; avgRating: number }>([
    {
      $match: {
        technicianId: { $in: techIds },
      },
    },
    {
      $group: {
        _id: '$technicianId',
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  const ratingMap = new Map<string, number>(
    ratings.map((entry) => [
      entry._id.toString(),
      Math.round(entry.avgRating * 10) / 10,
    ]),
  );

  // 5. Aggregate average resolution hours (actualStart to completedAt)
  const resolutionStats = await WorkOrder.aggregate<{
    _id: Types.ObjectId;
    avgResolutionHours: number;
  }>([
    {
      $match: {
        assignedTechnicianId: { $in: techIds },
        status: 'COMPLETED',
        actualStart: { $exists: true, $ne: null },
        completedAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        assignedTechnicianId: 1,
        resolutionHours: {
          $divide: [
            { $subtract: ['$completedAt', '$actualStart'] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $match: {
        resolutionHours: { $gte: 0 },
      },
    },
    {
      $group: {
        _id: '$assignedTechnicianId',
        avgResolutionHours: { $avg: '$resolutionHours' },
      },
    },
  ]);
  const resolutionMap = new Map<string, number>(
    resolutionStats.map((entry) => [
      entry._id.toString(),
      Math.round(entry.avgResolutionHours * 10) / 10,
    ]),
  );

  // 6. Build list items
  const items: TechnicianSummary[] = technicians.map((tech) => {
    const id = tech._id.toString();
    const safe = toSafeUser(tech);
    const matchesCategory = query.category
      ? (tech.specializations ?? []).includes(query.category)
      : undefined;

    return {
      ...safe,
      activeWorkOrderCount: activeCountMap.get(id) ?? 0,
      completedWorkOrderCount: completedCountMap.get(id) ?? 0,
      averageRating: ratingMap.get(id) ?? null,
      averageResolutionHours: resolutionMap.get(id) ?? null,
      matchesCategory,
    };
  });

  // 7. Sort: matches first if category requested, then availability, then active count asc, then name
  items.sort((a, b) => {
    if (query.category) {
      if (a.matchesCategory && !b.matchesCategory) return -1;
      if (!a.matchesCategory && b.matchesCategory) return 1;
    }

    const availA = AVAILABILITY_ORDER[a.availability ?? 'AVAILABLE'] ?? 1;
    const availB = AVAILABILITY_ORDER[b.availability ?? 'AVAILABLE'] ?? 1;
    if (availA !== availB) return availA - availB;

    if (a.activeWorkOrderCount !== b.activeWorkOrderCount) {
      return a.activeWorkOrderCount - b.activeWorkOrderCount;
    }

    return a.name.localeCompare(b.name);
  });

  const total = items.length;
  const pagedItems = items.slice((page - 1) * limit, page * limit);

  return paginate(pagedItems, page, limit, total);
}

export async function getTechnician(id: string): Promise<TechnicianDetail> {
  const tech = await User.findById(id);

  if (!tech || tech.role !== 'TECHNICIAN') {
    throw ApiError.notFound('Technician not found', 'technicianNotFound');
  }

  const techId = tech._id;

  // Active tasks
  const activeWOs = await WorkOrder.find({
    assignedTechnicianId: techId,
    status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
  })
    .populate<{ locationId: { _id: Types.ObjectId; buildingName: string; buildingNameAr?: string; floor: string; floorAr?: string; room: string; roomAr?: string } }>(
      'locationId',
      'buildingName buildingNameAr floor floorAr room roomAr',
    )
    .sort({ priority: 1, scheduledStart: 1 })
    .lean<Array<IWorkOrder & { _id: Types.ObjectId; locationId: any }>>();

  const activeTasks: TechnicianActiveTask[] = activeWOs.map((wo) => ({
    id: wo._id.toString(),
    workOrderNumber: wo.workOrderNumber,
    title: wo.title,
    titleAr: wo.titleAr,
    priority: wo.priority,
    status: wo.status,
    category: wo.category,
    scheduledStart: wo.scheduledStart,
    expectedCompletion: wo.expectedCompletion,
    actualStart: wo.actualStart,
    location: wo.locationId
      ? {
          id: wo.locationId._id.toString(),
          buildingName: wo.locationId.buildingName,
          buildingNameAr: wo.locationId.buildingNameAr,
          floor: wo.locationId.floor,
          floorAr: wo.locationId.floorAr,
          room: wo.locationId.room,
          roomAr: wo.locationId.roomAr,
        }
      : null,
  }));

  // Completed count
  const completedWorkOrderCount = await WorkOrder.countDocuments({
    assignedTechnicianId: techId,
    status: 'COMPLETED',
  });

  // Average rating
  const ratings = await ServiceFeedback.aggregate<{ _id: Types.ObjectId; avgRating: number }>([
    { $match: { technicianId: techId } },
    { $group: { _id: '$technicianId', avgRating: { $avg: '$rating' } } },
  ]);
  const averageRating =
    ratings.length > 0 && ratings[0] ? Math.round(ratings[0].avgRating * 10) / 10 : null;

  // Average resolution hours
  const resolutionStats = await WorkOrder.aggregate<{
    _id: Types.ObjectId;
    avgResolutionHours: number;
  }>([
    {
      $match: {
        assignedTechnicianId: techId,
        status: 'COMPLETED',
        actualStart: { $exists: true, $ne: null },
        completedAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        resolutionHours: {
          $divide: [
            { $subtract: ['$completedAt', '$actualStart'] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    { $match: { resolutionHours: { $gte: 0 } } },
    {
      $group: {
        _id: null,
        avgResolutionHours: { $avg: '$resolutionHours' },
      },
    },
  ]);
  const averageResolutionHours =
    resolutionStats.length > 0 && resolutionStats[0]
      ? Math.round(resolutionStats[0].avgResolutionHours * 10) / 10
      : null;

  return {
    ...toSafeUser(tech),
    activeWorkOrderCount: activeTasks.length,
    completedWorkOrderCount,
    averageRating,
    averageResolutionHours,
    activeTasks,
  };
}

export async function createTechnician(
  actorId: string,
  input: CreateTechnicianInput,
): Promise<SafeUser> {
  await assertEmailAvailable(input.email);

  const passwordHash = await hashPassword(input.password);
  const tech = await User.create({
    name: input.name,
    nameAr: input.nameAr,
    email: input.email.toLowerCase().trim(),
    passwordHash,
    role: 'TECHNICIAN', // Strictly forced to TECHNICIAN
    department: input.department,
    departmentAr: input.departmentAr,
    contactPhone: input.contactPhone,
    isActive: input.isActive ?? true,
    specializations: input.specializations ?? [],
    skills: input.skills ?? [],
    skillsAr: input.skillsAr ?? [],
    availability: input.availability ?? 'AVAILABLE',
  });

  await logActivity({
    actorId,
    action: 'TECHNICIAN_CREATED',
    entityType: 'User',
    entityId: tech._id,
    description: `Created technician account ${tech.name} (${tech.email})`,
    descriptionKey: 'technicianCreated',
    params: { name: tech.name, email: tech.email },
    metadata: {
      specializations: tech.specializations,
      skills: tech.skills,
      availability: tech.availability,
    },
  });

  return toSafeUser(tech);
}

export async function updateTechnician(
  actorId: string,
  id: string,
  input: UpdateTechnicianInput,
): Promise<SafeUser> {
  const tech = await User.findById(id);

  if (!tech) {
    throw ApiError.notFound('Technician not found', 'technicianNotFound');
  }

  // Acceptance scenario 1: "When they try to create or edit any other role, Then it is refused."
  if (tech.role !== 'TECHNICIAN') {
    throw ApiError.forbidden(
      'Only technician accounts can be managed via this endpoint',
      'technicianRoleOnly',
    );
  }

  if (input.email && input.email.toLowerCase().trim() !== tech.email) {
    await assertEmailAvailable(input.email, id);
    tech.email = input.email.toLowerCase().trim();
  }

  if (input.name !== undefined) tech.name = input.name;
  if (input.nameAr !== undefined) tech.nameAr = input.nameAr;
  if (input.department !== undefined) tech.department = input.department;
  if (input.departmentAr !== undefined) tech.departmentAr = input.departmentAr;
  if (input.contactPhone !== undefined) tech.contactPhone = input.contactPhone;
  if (input.specializations !== undefined) tech.specializations = input.specializations;
  if (input.skills !== undefined) tech.skills = input.skills;
  if (input.skillsAr !== undefined) tech.skillsAr = input.skillsAr;
  if (input.availability !== undefined) tech.availability = input.availability;
  if (input.isActive !== undefined) tech.isActive = input.isActive;

  if (input.password) {
    tech.passwordHash = await hashPassword(input.password);
  }

  await tech.save();

  await logActivity({
    actorId,
    action: 'TECHNICIAN_UPDATED',
    entityType: 'User',
    entityId: tech._id,
    description: `Updated technician account ${tech.name} (${tech.email})`,
    descriptionKey: 'technicianUpdated',
    params: { name: tech.name, email: tech.email },
    metadata: {
      specializations: tech.specializations,
      skills: tech.skills,
      availability: tech.availability,
      isActive: tech.isActive,
    },
  });

  return toSafeUser(tech);
}
