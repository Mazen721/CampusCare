import { subDays } from 'date-fns';
import { Types } from 'mongoose';
import {
  CLAIM_STATUSES,
  ITEM_STATUSES,
  PRIORITIES,
  REQUEST_STATUSES,
  ROLES,
  type ClaimStatus,
  type ItemStatus,
  type Priority,
  type RequestStatus,
  type Role,
  type WorkOrderStatus,
} from '../../config/constants';
import { Notification } from '../../shared/models/Notification.model';
import { User } from '../auth/user.model';
import {
  AiInsightCache,
  type InsightContent,
} from '../ai/aiInsightCache.model';
import { Location } from '../locations/location.model';
import { ClaimRequest } from '../lost-found/claims/claimRequest.model';
import { LostFoundItem } from '../lost-found/items/lostFoundItem.model';
import { ItemMatch } from '../lost-found/matches/itemMatch.model';
import { ServiceFeedback } from '../maintenance/feedback/serviceFeedback.model';
import { MaintenanceRequest } from '../maintenance/requests/maintenanceRequest.model';
import { WorkOrder } from '../maintenance/work-orders/workOrder.model';
import type { DashboardPeriod } from './dashboard.validation';

export interface DashboardActor {
  id: string;
  role: Role;
}

export interface PeriodRange {
  from: Date | null;
  to: Date;
}

export interface ManagerTechnicianPerformance {
  id: string;
  name: string;
  activeWorkOrders: number;
  completedWorkOrders: number;
  feedbackCount: number;
  averageRating: number | null;
}

export interface ManagerMetrics {
  totalRequests: number;
  requestsByStatus: Record<RequestStatus, number>;
  requestsByCategory: Array<{ category: string; count: number }>;
  requestsByBuilding: Array<{ building: string; count: number }>;
  activeWorkOrders: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
  averageResolutionHours: number | null;
  technicianWorkload: ManagerTechnicianPerformance[];
  feedback: {
    total: number;
    averageRating: number | null;
    distribution: Array<{ rating: number; count: number }>;
  };
}

export interface AdminDashboard {
  role: 'SUPER_ADMIN';
  period: DashboardPeriod;
  rangeStart: Date | null;
  rangeEnd: Date;
  totals: {
    users: number;
    activeUsers: number;
    technicians: number;
    locations: number;
    buildings: number;
    maintenanceRequests: number;
    workOrders: number;
    lostItems: number;
    foundItems: number;
    openLostFoundItems: number;
    pendingMatches: number;
    pendingClaims: number;
  };
  latestInsights: {
    period: '7d' | '30d';
    generatedAt: Date;
    rangeStart: Date;
    rangeEnd: Date;
    insights: InsightContent;
  } | null;
  analytics: {
    usersByRole: Array<{ role: Role; count: number }>;
    activityByBuilding: Array<{ building: string; maintenance: number; lostFound: number }>;
    moduleVolume: Array<{ module: string; count: number }>;
  };
}

export interface TechnicianDashboard {
  role: 'TECHNICIAN';
  period: DashboardPeriod;
  rangeStart: Date | null;
  rangeEnd: Date;
  counts: {
    assigned: number;
    inProgress: number;
    overdue: number;
    completed: number;
  };
  schedule: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    status: WorkOrderStatus;
    priority: string;
    category: string;
    scheduledStart?: Date;
    expectedCompletion?: Date;
    overdue: boolean;
    location: {
      id: string;
      buildingName: string;
      floor: string;
      room: string;
    } | null;
  }>;
  analytics: {
    byPriority: Array<{ priority: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    averageResolutionHours: number | null;
    averageRating: number | null;
    feedbackCount: number;
  };
}

export interface OfficerDashboard {
  role: 'LOST_FOUND_OFFICER';
  period: DashboardPeriod;
  rangeStart: Date | null;
  rangeEnd: Date;
  counts: {
    totalLostItems: number;
    totalFoundItems: number;
    openLostItems: number;
    openFoundItems: number;
    pendingMatches: number;
    pendingClaims: number;
    underVerificationClaims: number;
    claimsAwaitingHandover: number;
    completedHandovers: number;
  };
  analytics: {
    itemsByStatus: Array<{ status: string; count: number }>;
    itemsByCategory: Array<{ category: string; lost: number; found: number }>;
    claimsByStatus: Array<{ status: string; count: number }>;
  };
}

export interface StudentDashboard {
  role: 'STUDENT_EMPLOYEE';
  period: DashboardPeriod;
  rangeStart: Date | null;
  rangeEnd: Date;
  requests: {
    total: number;
    byStatus: Record<RequestStatus, number>;
    recent: Array<{
      id: string;
      requestNumber: string;
      title: string;
      status: RequestStatus;
      priority: string;
      createdAt: Date;
    }>;
  };
  claims: {
    total: number;
    recent: Array<{
      id: string;
      claimNumber: string;
      itemTitle: string;
      status: string;
      createdAt: Date;
    }>;
  };
  reports: {
    total: number;
    lost: number;
    found: number;
    recent: Array<{
      id: string;
      reportNumber: string;
      reportType: string;
      itemTitle: string;
      status: string;
      createdAt: Date;
    }>;
  };
  notifications: {
    unreadCount: number;
    recent: Array<{
      id: string;
      title: string;
      titleKey?: string;
      message: string;
      messageKey?: string;
      params?: Record<string, unknown>;
      linkUrl?: string;
      isRead: boolean;
      createdAt: Date;
    }>;
  };
}

export type DashboardResponse =
  | AdminDashboard
  | {
      role: 'MAINTENANCE_MANAGER';
      period: DashboardPeriod;
      rangeStart: Date | null;
      rangeEnd: Date;
      metrics: ManagerMetrics;
    }
  | TechnicianDashboard
  | OfficerDashboard
  | StudentDashboard;

interface CountRow {
  _id: string | null;
  count: number;
}

interface TechnicianCountRow {
  _id: Types.ObjectId;
  count: number;
}

interface RatingRow {
  _id: number;
  count: number;
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function resolvePeriodRange(
  period: DashboardPeriod,
  now: Date = new Date(),
): PeriodRange {
  if (period === 'all') {
    return { from: null, to: now };
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return { from: subDays(now, days), to: now };
}

function createdAtMatch(
  range: PeriodRange,
): { createdAt?: { $gte: Date; $lte: Date } } {
  return range.from
    ? { createdAt: { $gte: range.from, $lte: range.to } }
    : {};
}

async function countRequestsInRange(range: PeriodRange): Promise<number> {
  return MaintenanceRequest.countDocuments(createdAtMatch(range));
}

async function getRepeatedLocationIssues(
  range: PeriodRange,
): Promise<
  Array<{ building: string; floor: string; room: string; category: string; count: number }>
> {
  const rows = await MaintenanceRequest.aggregate<{
    _id: { building: string; floor: string; room: string; category: string };
    count: number;
  }>([
    { $match: createdAtMatch(range) },
    {
      $lookup: {
        from: 'locations',
        localField: 'locationId',
        foreignField: '_id',
        as: 'location',
      },
    },
    { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: {
          building: '$location.buildingName',
          floor: '$location.floor',
          room: '$location.room',
          category: '$category',
        },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 2 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return rows.map((row) => ({ ...row._id, count: row.count }));
}

export async function getManagerMetrics(range: PeriodRange): Promise<ManagerMetrics> {
  const requestMatch = createdAtMatch(range);

  const [statusRows, categoryRows, buildingRows, activeWorkOrders, completedRows, overdueWorkOrders, resolutionRows, ratingRows] =
    await Promise.all([
      MaintenanceRequest.aggregate<CountRow>([
        { $match: requestMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate<CountRow>([
        { $match: requestMatch },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      MaintenanceRequest.aggregate<CountRow>([
        { $match: requestMatch },
        {
          $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'location',
          },
        },
        { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$location.buildingName', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      WorkOrder.countDocuments({ status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }),
      WorkOrder.countDocuments({
        status: 'COMPLETED',
        ...(range.from
          ? { completedAt: { $gte: range.from, $lte: range.to } }
          : { completedAt: { $ne: null } }),
      }),
      WorkOrder.countDocuments({
        status: { $in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'] },
        expectedCompletion: { $lt: range.to },
      }),
      WorkOrder.aggregate<{ _id: null; hours: number | null }>([
        {
          $match: {
            actualStart: { $ne: null },
            completedAt: range.from
              ? { $gte: range.from, $lte: range.to }
              : { $ne: null },
          },
        },
        {
          $project: {
            hours: {
              $divide: [{ $subtract: ['$completedAt', '$actualStart'] }, 3_600_000],
            },
          },
        },
        { $group: { _id: null, hours: { $avg: '$hours' } } },
      ]),
      ServiceFeedback.aggregate<RatingRow>([
        { $match: createdAtMatch(range) },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

  const requestsByStatus = Object.fromEntries(
    REQUEST_STATUSES.map((status) => [status, 0]),
  ) as Record<RequestStatus, number>;

  statusRows.forEach((row) => {
    if (row._id && row._id in requestsByStatus) {
      requestsByStatus[row._id as RequestStatus] = row.count;
    }
  });

  const totalRequests = Object.values(requestsByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  const feedbackDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: ratingRows.find((row) => row._id === rating)?.count ?? 0,
  }));
  const feedbackTotal = feedbackDistribution.reduce((sum, entry) => sum + entry.count, 0);
  const feedbackAverage =
    feedbackTotal === 0
      ? null
      : round(
          feedbackDistribution.reduce((sum, entry) => sum + entry.rating * entry.count, 0) /
            feedbackTotal,
        );

  const technicianWorkload = await getTechnicianPerformance(range);

  return {
    totalRequests,
    requestsByStatus,
    requestsByCategory: categoryRows
      .filter((row): row is CountRow & { _id: string } => Boolean(row._id))
      .map((row) => ({ category: row._id, count: row.count })),
    requestsByBuilding: buildingRows.map((row) => ({
      building: row._id ?? 'Unassigned location',
      count: row.count,
    })),
    activeWorkOrders,
    completedWorkOrders: completedRows,
    overdueWorkOrders,
    averageResolutionHours:
      resolutionRows[0]?.hours === null || resolutionRows[0]?.hours === undefined
        ? null
        : round(resolutionRows[0].hours),
    technicianWorkload,
    feedback: {
      total: feedbackTotal,
      averageRating: feedbackAverage,
      distribution: feedbackDistribution,
    },
  };
}

async function getTechnicianPerformance(
  range: PeriodRange,
): Promise<ManagerTechnicianPerformance[]> {
  const technicians = await User.find({ role: 'TECHNICIAN', isActive: true })
    .select('name')
    .sort({ name: 1 })
    .lean<Array<{ _id: Types.ObjectId; name: string }>>();

  if (technicians.length === 0) {
    return [];
  }

  const technicianIds = technicians.map((technician) => technician._id);

  const [activeRows, completedRows, ratingRows] = await Promise.all([
    WorkOrder.aggregate<TechnicianCountRow>([
      {
        $match: {
          assignedTechnicianId: { $in: technicianIds },
          status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      },
      { $group: { _id: '$assignedTechnicianId', count: { $sum: 1 } } },
    ]),
    WorkOrder.aggregate<TechnicianCountRow>([
      {
        $match: {
          assignedTechnicianId: { $in: technicianIds },
          status: 'COMPLETED',
          ...(range.from
            ? { completedAt: { $gte: range.from, $lte: range.to } }
            : { completedAt: { $ne: null } }),
        },
      },
      { $group: { _id: '$assignedTechnicianId', count: { $sum: 1 } } },
    ]),
    ServiceFeedback.aggregate<{ _id: Types.ObjectId; averageRating: number; count: number }>([
      {
        $match: {
          technicianId: { $in: technicianIds },
          ...createdAtMatch(range),
        },
      },
      {
        $group: {
          _id: '$technicianId',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const activeMap = new Map(
    activeRows.map((row) => [row._id.toString(), row.count]),
  );
  const completedMap = new Map(
    completedRows.map((row) => [row._id.toString(), row.count]),
  );
  const ratingMap = new Map(
    ratingRows.map((row) => [
      row._id.toString(),
      { averageRating: row.averageRating, count: row.count },
    ]),
  );

  return technicians
    .map((technician) => {
      const id = technician._id.toString();
      const rating = ratingMap.get(id);

      return {
        id,
        name: technician.name,
        activeWorkOrders: activeMap.get(id) ?? 0,
        completedWorkOrders: completedMap.get(id) ?? 0,
        feedbackCount: rating?.count ?? 0,
        averageRating: rating ? round(rating.averageRating) : null,
      };
    })
    .sort(
      (a, b) =>
        b.activeWorkOrders - a.activeWorkOrders ||
        b.completedWorkOrders - a.completedWorkOrders ||
        a.name.localeCompare(b.name),
    );
}

async function getAdminDashboard(
  period: DashboardPeriod,
  range: PeriodRange,
): Promise<AdminDashboard> {
  const [
    users,
    activeUsers,
    technicians,
    locations,
    buildingNames,
    maintenanceRequests,
    workOrders,
    lostItems,
    foundItems,
    openLostFoundItems,
    pendingMatches,
    pendingClaims,
    latestInsight,
    userRoleRows,
    mrBuildingRows,
    lfBuildingRows,
    requestsInRange,
    workOrdersInRange,
    lostInRange,
    foundInRange,
    claimsInRange,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'TECHNICIAN' }),
    Location.countDocuments({ isActive: true }),
    Location.distinct('buildingName'),
    MaintenanceRequest.countDocuments({}),
    WorkOrder.countDocuments({}),
    LostFoundItem.countDocuments({ reportType: 'LOST' }),
    LostFoundItem.countDocuments({ reportType: 'FOUND' }),
    LostFoundItem.countDocuments({ status: { $in: ['OPEN', 'MATCH_CONFIRMED'] } }),
    ItemMatch.countDocuments({ status: 'SUGGESTED' }),
    ClaimRequest.countDocuments({ status: { $in: ['PENDING_REVIEW', 'UNDER_VERIFICATION'] } }),
    AiInsightCache.findOne({}).sort({ generatedAt: -1 }).lean(),
    User.aggregate<CountRow>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    MaintenanceRequest.aggregate<CountRow>([
      { $match: createdAtMatch(range) },
      {
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$location.buildingName', count: { $sum: 1 } } },
    ]),
    LostFoundItem.aggregate<CountRow>([
      { $match: createdAtMatch(range) },
      {
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$location.buildingName', count: { $sum: 1 } } },
    ]),
    MaintenanceRequest.countDocuments(createdAtMatch(range)),
    WorkOrder.countDocuments(createdAtMatch(range)),
    LostFoundItem.countDocuments({ reportType: 'LOST', ...createdAtMatch(range) }),
    LostFoundItem.countDocuments({ reportType: 'FOUND', ...createdAtMatch(range) }),
    ClaimRequest.countDocuments(createdAtMatch(range)),
  ]);

  const userRoleMap = new Map(userRoleRows.map((row) => [row._id, row.count]));
  const usersByRole = ROLES.map((role) => ({
    role,
    count: userRoleMap.get(role) ?? 0,
  }));

  const buildingActivityMap = new Map<string, { maintenance: number; lostFound: number }>();
  mrBuildingRows.forEach((row) => {
    if (!row._id) return;
    const current = buildingActivityMap.get(row._id) ?? { maintenance: 0, lostFound: 0 };
    current.maintenance = row.count;
    buildingActivityMap.set(row._id, current);
  });
  lfBuildingRows.forEach((row) => {
    if (!row._id) return;
    const current = buildingActivityMap.get(row._id) ?? { maintenance: 0, lostFound: 0 };
    current.lostFound = row.count;
    buildingActivityMap.set(row._id, current);
  });
  const activityByBuilding = Array.from(buildingActivityMap.entries())
    .map(([building, counts]) => ({
      building,
      maintenance: counts.maintenance,
      lostFound: counts.lostFound,
    }))
    .sort((a, b) => b.maintenance + b.lostFound - (a.maintenance + a.lostFound))
    .slice(0, 6);

  const moduleVolume = [
    { module: 'Requests', count: requestsInRange },
    { module: 'Work Orders', count: workOrdersInRange },
    { module: 'Lost Items', count: lostInRange },
    { module: 'Found Items', count: foundInRange },
    { module: 'Claims', count: claimsInRange },
  ];

  return {
    role: 'SUPER_ADMIN',
    period,
    rangeStart: range.from,
    rangeEnd: range.to,
    totals: {
      users,
      activeUsers,
      technicians,
      locations,
      buildings: buildingNames.length,
      maintenanceRequests,
      workOrders,
      lostItems,
      foundItems,
      openLostFoundItems,
      pendingMatches,
      pendingClaims,
    },
    latestInsights: latestInsight
      ? {
          period: latestInsight.period,
          generatedAt: latestInsight.generatedAt,
          rangeStart: latestInsight.rangeStart,
          rangeEnd: latestInsight.rangeEnd,
          insights: latestInsight.insights,
        }
      : null,
    analytics: {
      usersByRole,
      activityByBuilding,
      moduleVolume,
    },
  };
}

async function getTechnicianDashboard(
  actorId: string,
  period: DashboardPeriod,
  range: PeriodRange,
): Promise<TechnicianDashboard> {
  const technicianId = new Types.ObjectId(actorId);
  const now = range.to;

  const [
    assigned,
    inProgress,
    overdue,
    completed,
    schedule,
    priorityRows,
    categoryRows,
    resolutionRows,
    feedbackRows,
  ] = await Promise.all([
    WorkOrder.countDocuments({
      assignedTechnicianId: technicianId,
      status: 'ASSIGNED',
    }),
    WorkOrder.countDocuments({
      assignedTechnicianId: technicianId,
      status: 'IN_PROGRESS',
    }),
    WorkOrder.countDocuments({
      assignedTechnicianId: technicianId,
      status: { $in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'] },
      expectedCompletion: { $lt: now },
    }),
    WorkOrder.countDocuments({
      assignedTechnicianId: technicianId,
      status: 'COMPLETED',
      ...(range.from
        ? { completedAt: { $gte: range.from, $lte: range.to } }
        : { completedAt: { $ne: null } }),
    }),
    WorkOrder.find({
      assignedTechnicianId: technicianId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    })
      .populate('locationId', 'buildingName floor room')
      .sort({ scheduledStart: 1, expectedCompletion: 1 })
      .limit(10)
      .lean(),
    WorkOrder.aggregate<CountRow>([
      {
        $match: {
          assignedTechnicianId: technicianId,
          ...(range.from ? { createdAt: { $gte: range.from, $lte: range.to } } : {}),
        },
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    WorkOrder.aggregate<CountRow>([
      {
        $match: {
          assignedTechnicianId: technicianId,
          ...(range.from ? { createdAt: { $gte: range.from, $lte: range.to } } : {}),
        },
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    WorkOrder.aggregate<{ _id: null; hours: number | null }>([
      {
        $match: {
          assignedTechnicianId: technicianId,
          actualStart: { $ne: null },
          completedAt: range.from
            ? { $gte: range.from, $lte: range.to }
            : { $ne: null },
        },
      },
      {
        $project: {
          hours: {
            $divide: [{ $subtract: ['$completedAt', '$actualStart'] }, 3_600_000],
          },
        },
      },
      { $group: { _id: null, hours: { $avg: '$hours' } } },
    ]),
    ServiceFeedback.aggregate<{ _id: null; averageRating: number; count: number }>([
      {
        $match: {
          technicianId,
          ...createdAtMatch(range),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const priorityMap = new Map(priorityRows.map((row) => [row._id, row.count]));
  const byPriority = PRIORITIES.map((priority) => ({
    priority,
    count: priorityMap.get(priority) ?? 0,
  }));

  const byCategory = categoryRows
    .filter((row): row is CountRow & { _id: string } => Boolean(row._id))
    .map((row) => ({ category: row._id, count: row.count }));

  const statusDistribution = [
    { status: 'Assigned', count: assigned },
    { status: 'In Progress', count: inProgress },
    { status: 'Completed', count: completed },
    { status: 'Overdue', count: overdue },
  ];

  const averageResolutionHours =
    resolutionRows[0]?.hours === null || resolutionRows[0]?.hours === undefined
      ? null
      : round(resolutionRows[0].hours);

  const averageRating =
    feedbackRows[0]?.averageRating === null || feedbackRows[0]?.averageRating === undefined
      ? null
      : round(feedbackRows[0].averageRating);

  const feedbackCount = feedbackRows[0]?.count ?? 0;

  return {
    role: 'TECHNICIAN',
    period,
    rangeStart: range.from,
    rangeEnd: range.to,
    counts: { assigned, inProgress, overdue, completed },
    schedule: schedule.map((workOrder) => {
      const location = workOrder.locationId as unknown as
        | { _id: Types.ObjectId; buildingName: string; floor: string; room: string }
        | null;
      const isOverdue = Boolean(
        workOrder.status !== 'COMPLETED' &&
          workOrder.status !== 'CANCELLED' &&
          workOrder.expectedCompletion &&
          new Date(workOrder.expectedCompletion).getTime() < now.getTime(),
      );

      return {
        id: workOrder._id.toString(),
        workOrderNumber: workOrder.workOrderNumber,
        title: workOrder.title,
        status: workOrder.status,
        priority: workOrder.priority,
        category: workOrder.category,
        scheduledStart: workOrder.scheduledStart,
        expectedCompletion: workOrder.expectedCompletion,
        overdue: isOverdue,
        location: location
          ? {
              id: location._id.toString(),
              buildingName: location.buildingName,
              floor: location.floor,
              room: location.room,
            }
          : null,
      };
    }),
    analytics: {
      byPriority,
      byCategory,
      statusDistribution,
      averageResolutionHours,
      averageRating,
      feedbackCount,
    },
  };
}

async function getOfficerDashboard(
  period: DashboardPeriod,
  range: PeriodRange,
): Promise<OfficerDashboard> {
  const [
    totalLostItems,
    totalFoundItems,
    openLostItems,
    openFoundItems,
    pendingMatches,
    pendingClaims,
    underVerificationClaims,
    claimsAwaitingHandover,
    completedHandovers,
    itemStatusRows,
    categoryReportRows,
    claimStatusRows,
  ] = await Promise.all([
    LostFoundItem.countDocuments({ reportType: 'LOST' }),
    LostFoundItem.countDocuments({ reportType: 'FOUND' }),
    LostFoundItem.countDocuments({ reportType: 'LOST', status: 'OPEN' }),
    LostFoundItem.countDocuments({ reportType: 'FOUND', status: 'OPEN' }),
    ItemMatch.countDocuments({ status: 'SUGGESTED' }),
    ClaimRequest.countDocuments({ status: 'PENDING_REVIEW' }),
    ClaimRequest.countDocuments({ status: 'UNDER_VERIFICATION' }),
    ClaimRequest.countDocuments({ status: 'APPROVED' }),
    ClaimRequest.countDocuments({ status: 'COMPLETED' }),
    LostFoundItem.aggregate<CountRow>([
      { $match: createdAtMatch(range) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    LostFoundItem.aggregate<{ _id: { category: string; reportType: string }; count: number }>([
      { $match: createdAtMatch(range) },
      { $group: { _id: { category: '$category', reportType: '$reportType' }, count: { $sum: 1 } } },
    ]),
    ClaimRequest.aggregate<CountRow>([
      { $match: createdAtMatch(range) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const itemStatusMap = new Map(itemStatusRows.map((row) => [row._id, row.count]));
  const itemsByStatus = ITEM_STATUSES.map((status) => ({
    status,
    count: itemStatusMap.get(status) ?? 0,
  }));

  const categoryMap = new Map<string, { lost: number; found: number }>();
  categoryReportRows.forEach((row) => {
    const cat = row._id.category;
    if (!cat) return;
    const current = categoryMap.get(cat) ?? { lost: 0, found: 0 };
    if (row._id.reportType === 'LOST') current.lost = row.count;
    if (row._id.reportType === 'FOUND') current.found = row.count;
    categoryMap.set(cat, current);
  });
  const itemsByCategory = Array.from(categoryMap.entries())
    .map(([category, counts]) => ({
      category,
      lost: counts.lost,
      found: counts.found,
    }))
    .sort((a, b) => b.lost + b.found - (a.lost + a.found))
    .slice(0, 6);

  const claimStatusMap = new Map(claimStatusRows.map((row) => [row._id, row.count]));
  const claimsByStatus = CLAIM_STATUSES.map((status) => ({
    status,
    count: claimStatusMap.get(status) ?? 0,
  }));

  return {
    role: 'LOST_FOUND_OFFICER',
    period,
    rangeStart: range.from,
    rangeEnd: range.to,
    counts: {
      totalLostItems,
      totalFoundItems,
      openLostItems,
      openFoundItems,
      pendingMatches,
      pendingClaims,
      underVerificationClaims,
      claimsAwaitingHandover,
      completedHandovers,
    },
    analytics: {
      itemsByStatus,
      itemsByCategory,
      claimsByStatus,
    },
  };
}

async function getStudentDashboard(
  actorId: string,
  period: DashboardPeriod,
  range: PeriodRange,
): Promise<StudentDashboard> {
  const userId = new Types.ObjectId(actorId);
  const rangeMatch = createdAtMatch(range);

  const [
    requestStatusRows,
    recentRequests,
    claimStatusRows,
    recentClaims,
    reportTypeRows,
    recentReports,
    unreadCount,
    recentNotifications,
  ] = await Promise.all([
    MaintenanceRequest.aggregate<CountRow>([
      { $match: { requesterId: userId, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MaintenanceRequest.find({ requesterId: userId, ...rangeMatch })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('requestNumber title status priority createdAt')
      .lean(),
    ClaimRequest.aggregate<CountRow>([
      { $match: { claimantId: userId, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ClaimRequest.find({ claimantId: userId, ...rangeMatch })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('itemId', 'itemTitle')
      .lean(),
    LostFoundItem.aggregate<CountRow>([
      { $match: { reporterId: userId, ...rangeMatch } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
    ]),
    LostFoundItem.find({ reporterId: userId, ...rangeMatch })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reportNumber reportType itemTitle status createdAt')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message linkUrl isRead createdAt')
      .lean(),
  ]);

  const byStatus = Object.fromEntries(
    REQUEST_STATUSES.map((status) => [status, 0]),
  ) as Record<RequestStatus, number>;
  requestStatusRows.forEach((row) => {
    if (row._id && row._id in byStatus) {
      byStatus[row._id as RequestStatus] = row.count;
    }
  });

  const totalRequests = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
  const totalClaims = claimStatusRows.reduce((sum, row) => sum + row.count, 0);
  const lost = reportTypeRows.find((row) => row._id === 'LOST')?.count ?? 0;
  const found = reportTypeRows.find((row) => row._id === 'FOUND')?.count ?? 0;

  return {
    role: 'STUDENT_EMPLOYEE',
    period,
    rangeStart: range.from,
    rangeEnd: range.to,
    requests: {
      total: totalRequests,
      byStatus,
      recent: recentRequests.map((request) => ({
        id: request._id.toString(),
        requestNumber: request.requestNumber,
        title: request.title,
        status: request.status,
        priority: request.priority,
        createdAt: request.createdAt,
      })),
    },
    claims: {
      total: totalClaims,
      recent: recentClaims.map((claim) => {
        const item = claim.itemId as unknown as { itemTitle?: string } | null;
        return {
          id: claim._id.toString(),
          claimNumber: claim.claimNumber,
          itemTitle: item?.itemTitle ?? 'Lost & found item',
          status: claim.status,
          createdAt: claim.createdAt,
        };
      }),
    },
    reports: {
      total: lost + found,
      lost,
      found,
      recent: recentReports.map((report) => ({
        id: report._id.toString(),
        reportNumber: report.reportNumber,
        reportType: report.reportType,
        itemTitle: report.itemTitle,
        status: report.status,
        createdAt: report.createdAt,
      })),
    },
    notifications: {
      unreadCount,
      recent: recentNotifications.map((notification) => ({
        id: notification._id.toString(),
        title: notification.title,
        titleKey: notification.titleKey,
        message: notification.message,
        messageKey: notification.messageKey,
        params: notification.params,
        linkUrl: notification.linkUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      })),
    },
  };
}

/**
 * Builds the role-specific dashboard payload. The role always comes from the
 * authenticated user; there is no role parameter.
 */
export async function getDashboard(
  actor: DashboardActor,
  period: DashboardPeriod,
): Promise<DashboardResponse> {
  const range = resolvePeriodRange(period);

  switch (actor.role) {
    case 'SUPER_ADMIN':
      return getAdminDashboard(period, range);
    case 'MAINTENANCE_MANAGER':
      return {
        role: 'MAINTENANCE_MANAGER',
        period,
        rangeStart: range.from,
        rangeEnd: range.to,
        metrics: await getManagerMetrics(range),
      };
    case 'TECHNICIAN':
      return getTechnicianDashboard(actor.id, period, range);
    case 'LOST_FOUND_OFFICER':
      return getOfficerDashboard(period, range);
    case 'STUDENT_EMPLOYEE':
      return getStudentDashboard(actor.id, period, range);
    default: {
      const exhaustive: never = actor.role;
      throw new Error(`Unsupported dashboard role: ${String(exhaustive)}`);
    }
  }
}

export async function getInsightGenerationStats(
  period: '7d' | '30d',
  now: Date = new Date(),
): Promise<{
  stats: Record<string, unknown>;
  rangeStart: Date;
  rangeEnd: Date;
  previousRangeStart: Date;
  previousRangeEnd: Date;
}> {
  const days = period === '7d' ? 7 : 30;
  const rangeEnd = now;
  const rangeStart = subDays(now, days);
  const previousRangeEnd = rangeStart;
  const previousRangeStart = subDays(rangeStart, days);
  const range: PeriodRange = { from: rangeStart, to: rangeEnd };
  const previousRange: PeriodRange = {
    from: previousRangeStart,
    to: previousRangeEnd,
  };

  const [metrics, previousTotalRequests, repeatedIssues] = await Promise.all([
    getManagerMetrics(range),
    countRequestsInRange(previousRange),
    getRepeatedLocationIssues(range),
  ]);

  const totalRequests = metrics.totalRequests;
  const requestChangePercent =
    previousTotalRequests === 0
      ? totalRequests > 0
        ? 100
        : 0
      : round(((totalRequests - previousTotalRequests) / previousTotalRequests) * 100);

  const anonymizedTechnicians = metrics.technicianWorkload.map((technician, index) => ({
    label: `Technician ${String.fromCharCode(65 + (index % 26))}`,
    activeWorkOrders: technician.activeWorkOrders,
    completedWorkOrders: technician.completedWorkOrders,
    feedbackCount: technician.feedbackCount,
    averageRating: technician.averageRating,
  }));

  const stats = {
    period,
    rangeStart,
    rangeEnd,
    previousRangeStart,
    previousRangeEnd,
    requests: {
      total: totalRequests,
      previousTotal: previousTotalRequests,
      changePercent: requestChangePercent,
      byStatus: metrics.requestsByStatus,
      byCategory: metrics.requestsByCategory.slice(0, 5),
      byBuilding: metrics.requestsByBuilding.slice(0, 5),
      repeatedLocationIssues: repeatedIssues,
    },
    workOrders: {
      active: metrics.activeWorkOrders,
      completed: metrics.completedWorkOrders,
      overdue: metrics.overdueWorkOrders,
      averageResolutionHours: metrics.averageResolutionHours,
    },
    technicians: anonymizedTechnicians,
    feedback: metrics.feedback,
  };

  return { stats, rangeStart, rangeEnd, previousRangeStart, previousRangeEnd };
}
