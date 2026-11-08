import { addHours } from 'date-fns';
import { Types, type FilterQuery } from 'mongoose';
import type {
  MaintenanceCategory,
  Priority,
  RecurrenceType,
  Role,
} from '../../config/constants';
import { logActivity } from '../../shared/services/activityLog.service';
import { nextNumber } from '../../shared/services/counter.service';
import { ApiError } from '../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../shared/utils/paginate';
import { User } from '../auth/user.model';
import { Location } from '../locations/location.model';
import { WorkOrder } from '../maintenance/work-orders/workOrder.model';
import {
  PreventivePlan,
  type IPreventivePlan,
} from './preventivePlan.model';
import { advancePastNow } from './recurrence';
import type {
  CreatePreventivePlanInput,
  ListPreventivePlansQuery,
  UpdatePreventivePlanInput,
  UpdatePreventivePlanStatusInput,
} from './preventive.validation';

interface PopulatedLocation {
  _id: Types.ObjectId;
  buildingName: string;
  floor: string;
  room: string;
}

interface PopulatedTechnician {
  _id: Types.ObjectId;
  name: string;
  availability?: string;
}

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  role?: Role;
}

interface PopulatedPreventivePlan
  extends Omit<
    IPreventivePlan,
    'locationId' | 'assignedTechnicianId' | 'createdBy'
  > {
  _id: Types.ObjectId;
  locationId?: PopulatedLocation | null;
  assignedTechnicianId?: PopulatedTechnician | null;
  createdBy?: PopulatedUser | null;
}

export interface SerializedPreventivePlan {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  location: {
    id: string;
    buildingName: string;
    floor: string;
    room: string;
  } | null;
  assignedTechnician: {
    id: string;
    name: string;
    availability?: string;
  } | null;
  recurrenceType: RecurrenceType;
  recurrenceIntervalDays?: number;
  startDate: Date;
  nextScheduledDate: Date;
  lastGeneratedDate?: Date;
  expectedDurationHours: number;
  isActive: boolean;
  overdue: boolean;
  createdBy: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const PLAN_POPULATION = [
  { path: 'locationId', select: 'buildingName floor room' },
  { path: 'assignedTechnicianId', select: 'name availability' },
  { path: 'createdBy', select: 'name role' },
];

function serializePlan(plan: PopulatedPreventivePlan): SerializedPreventivePlan {
  const location = plan.locationId;
  const technician = plan.assignedTechnicianId;
  const creator = plan.createdBy;
  const now = Date.now();

  return {
    id: plan._id.toString(),
    title: plan.title,
    description: plan.description,
    category: plan.category,
    priority: plan.priority,
    location: location
      ? {
          id: location._id.toString(),
          buildingName: location.buildingName,
          floor: location.floor,
          room: location.room,
        }
      : null,
    assignedTechnician: technician
      ? {
          id: technician._id.toString(),
          name: technician.name,
          availability: technician.availability,
        }
      : null,
    recurrenceType: plan.recurrenceType,
    recurrenceIntervalDays: plan.recurrenceIntervalDays,
    startDate: plan.startDate,
    nextScheduledDate: plan.nextScheduledDate,
    lastGeneratedDate: plan.lastGeneratedDate,
    expectedDurationHours: plan.expectedDurationHours,
    isActive: plan.isActive,
    overdue: plan.isActive && new Date(plan.nextScheduledDate).getTime() <= now,
    createdBy: creator
      ? { id: creator._id.toString(), name: creator.name }
      : null,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

async function getPlanDocument(id: string): Promise<PopulatedPreventivePlan> {
  const plan = await PreventivePlan.findById(id)
    .populate(PLAN_POPULATION)
    .lean<PopulatedPreventivePlan | null>();

  if (!plan) {
    throw ApiError.notFound('Preventive plan not found');
  }

  return plan;
}

async function assertActiveLocation(locationId: string): Promise<void> {
  const location = await Location.findOne({
    _id: locationId,
    isActive: true,
  }).select('_id');

  if (!location) {
    throw ApiError.badRequest('Select an active campus location');
  }
}

async function assertActiveTechnician(technicianId?: string): Promise<void> {
  if (!technicianId) return;

  const technician = await User.findOne({
    _id: technicianId,
    role: 'TECHNICIAN',
    isActive: true,
  }).select('_id');

  if (!technician) {
    throw ApiError.badRequest('Select an active technician');
  }
}

export async function listPreventivePlans(
  query: ListPreventivePlansQuery,
): Promise<{
  data: SerializedPreventivePlan[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<IPreventivePlan> = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const [plans, total] = await Promise.all([
    PreventivePlan.find(filter)
      .populate(PLAN_POPULATION)
      .sort({ isActive: -1, nextScheduledDate: 1, title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PopulatedPreventivePlan[]>(),
    PreventivePlan.countDocuments(filter),
  ]);

  return paginate(plans.map(serializePlan), page, limit, total);
}

export async function createPreventivePlan(
  actorId: string,
  input: CreatePreventivePlanInput,
): Promise<SerializedPreventivePlan> {
  await assertActiveLocation(input.locationId);
  await assertActiveTechnician(input.assignedTechnicianId);

  const plan = await PreventivePlan.create({
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    locationId: input.locationId,
    assignedTechnicianId: input.assignedTechnicianId,
    recurrenceType: input.recurrenceType,
    recurrenceIntervalDays: input.recurrenceIntervalDays,
    startDate: input.startDate,
    nextScheduledDate: input.startDate,
    expectedDurationHours: input.expectedDurationHours,
    isActive: input.isActive ?? true,
    createdBy: actorId,
  });

  await logActivity({
    actorId,
    action: 'PREVENTIVE_PLAN_CREATED',
    entityType: 'PreventivePlan',
    entityId: plan._id,
    description: `Created preventive plan ${plan.title} (${plan.recurrenceType})`,
    metadata: {
      category: plan.category,
      recurrenceType: plan.recurrenceType,
      recurrenceIntervalDays: plan.recurrenceIntervalDays,
      startDate: plan.startDate,
      assignedTechnicianId: plan.assignedTechnicianId?.toString(),
    },
  });

  return serializePlan(await getPlanDocument(plan._id.toString()));
}

export async function updatePreventivePlan(
  actorId: string,
  id: string,
  input: UpdatePreventivePlanInput,
): Promise<SerializedPreventivePlan> {
  const plan = await PreventivePlan.findById(id);

  if (!plan) {
    throw ApiError.notFound('Preventive plan not found');
  }

  const effectiveType = input.recurrenceType ?? plan.recurrenceType;
  const effectiveInterval = input.recurrenceIntervalDays ?? plan.recurrenceIntervalDays;

  if (effectiveType === 'CUSTOM_DAYS' && (!effectiveInterval || effectiveInterval < 1)) {
    throw ApiError.badRequest(
      'recurrenceIntervalDays is required when recurrenceType is CUSTOM_DAYS',
    );
  }

  if (input.locationId !== undefined) {
    await assertActiveLocation(input.locationId);
    plan.locationId = new Types.ObjectId(input.locationId);
  }

  if (input.assignedTechnicianId !== undefined) {
    await assertActiveTechnician(input.assignedTechnicianId ?? undefined);
    plan.assignedTechnicianId =
      input.assignedTechnicianId === null
        ? undefined
        : new Types.ObjectId(input.assignedTechnicianId);
  }

  if (input.title !== undefined) plan.title = input.title;
  if (input.description !== undefined) plan.description = input.description;
  if (input.category !== undefined) plan.category = input.category;
  if (input.priority !== undefined) plan.priority = input.priority;
  if (input.recurrenceType !== undefined) plan.recurrenceType = input.recurrenceType;
  if (input.recurrenceIntervalDays !== undefined) {
    plan.recurrenceIntervalDays = input.recurrenceIntervalDays;
  }
  if (input.expectedDurationHours !== undefined) {
    plan.expectedDurationHours = input.expectedDurationHours;
  }
  if (input.isActive !== undefined) plan.isActive = input.isActive;

  const scheduleChanged =
    input.recurrenceType !== undefined ||
    input.recurrenceIntervalDays !== undefined ||
    input.startDate !== undefined;

  if (input.startDate !== undefined) {
    plan.startDate = input.startDate;
  }

  if (scheduleChanged) {
    plan.nextScheduledDate = plan.startDate;
  }

  await plan.save();

  await logActivity({
    actorId,
    action: 'PREVENTIVE_PLAN_UPDATED',
    entityType: 'PreventivePlan',
    entityId: plan._id,
    description: `Updated preventive plan ${plan.title}`,
    metadata: {
      recurrenceType: plan.recurrenceType,
      recurrenceIntervalDays: plan.recurrenceIntervalDays,
      startDate: plan.startDate,
      isActive: plan.isActive,
    },
  });

  return serializePlan(await getPlanDocument(plan._id.toString()));
}

export async function updatePreventivePlanStatus(
  actorId: string,
  id: string,
  input: UpdatePreventivePlanStatusInput,
): Promise<SerializedPreventivePlan> {
  const plan = await PreventivePlan.findById(id);

  if (!plan) {
    throw ApiError.notFound('Preventive plan not found');
  }

  plan.isActive = input.isActive;
  await plan.save();

  await logActivity({
    actorId,
    action: input.isActive ? 'PREVENTIVE_PLAN_ACTIVATED' : 'PREVENTIVE_PLAN_DEACTIVATED',
    entityType: 'PreventivePlan',
    entityId: plan._id,
    description: `${input.isActive ? 'Activated' : 'Deactivated'} preventive plan ${plan.title}`,
  });

  return serializePlan(await getPlanDocument(plan._id.toString()));
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11_000
  );
}

export interface GenerateDueResult {
  created: number;
  skipped: number;
  processed: number;
}

/**
 * Creates one work order for each active plan whose next occurrence is due,
 * then advances the plan past now. Duplicate keys from the partial unique index
 * mean the occurrence was already generated and are not treated as failures.
 */
export async function generateDueWorkOrders(
  actorId: string,
): Promise<GenerateDueResult> {
  const now = new Date();
  const duePlans = await PreventivePlan.find({
    isActive: true,
    nextScheduledDate: { $lte: now },
  }).sort({ nextScheduledDate: 1 });

  let created = 0;
  let skipped = 0;

  for (const plan of duePlans) {
    const scheduledStart = new Date(plan.nextScheduledDate);
    const expectedCompletion = addHours(scheduledStart, plan.expectedDurationHours);

    try {
      const workOrderNumber = await nextNumber('WO');
      const workOrder = await WorkOrder.create({
        workOrderNumber,
        sourceType: 'PREVENTIVE',
        preventivePlanId: plan._id,
        assignedTechnicianId: plan.assignedTechnicianId,
        title: plan.title,
        description: plan.description,
        category: plan.category,
        priority: plan.priority,
        locationId: plan.locationId,
        status: plan.assignedTechnicianId ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
        scheduledStart,
        expectedCompletion,
        technicianNotes: [],
      });

      created += 1;

      await logActivity({
        actorId,
        action: 'PREVENTIVE_WORK_ORDER_GENERATED',
        entityType: 'WorkOrder',
        entityId: workOrder._id,
        description: `Generated preventive work order ${workOrder.workOrderNumber} from plan ${plan.title}`,
        metadata: {
          preventivePlanId: plan._id.toString(),
          scheduledStart,
          expectedCompletion,
        },
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      skipped += 1;

      await logActivity({
        actorId,
        action: 'PREVENTIVE_WORK_ORDER_SKIPPED',
        entityType: 'PreventivePlan',
        entityId: plan._id,
        description: `Skipped already-generated preventive occurrence for ${plan.title}`,
        metadata: { scheduledStart },
      });
    }

    plan.lastGeneratedDate = scheduledStart;
    plan.nextScheduledDate = advancePastNow(
      scheduledStart,
      {
        recurrenceType: plan.recurrenceType,
        recurrenceIntervalDays: plan.recurrenceIntervalDays,
      },
      now,
    );
    await plan.save();
  }

  return { created, skipped, processed: duePlans.length };
}
