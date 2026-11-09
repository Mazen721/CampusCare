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
import { applyNotificationLocalization } from '../../shared/utils/notificationLocalization';
import { getRequestLang } from '../../shared/utils/requestContext';
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
  requestsByBuilding: Array<{ name: string; nameAr?: string; building: string; buildingAr?: string; count: number }>;
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

interface InsightLocationRef {
  buildingName?: string;
  buildingNameAr?: string;
  floor?: string;
  floorAr?: string;
  room?: string;
  roomAr?: string;
}

interface InsightWorkOrderDetail {
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  priority: Priority;
  status: WorkOrderStatus;
  expectedCompletion?: Date;
  assignedTechnicianId?: { name?: string } | null;
  locationId?: InsightLocationRef | null;
}

interface InsightRequestDetail {
  requestNumber: string;
  title: string;
  titleAr?: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: Date;
  locationId?: InsightLocationRef | null;
}

interface InsightFeedbackDetail {
  rating: number;
  comment?: string;
  commentAr?: string;
  createdAt: Date;
  technicianId?: { name?: string } | null;
  maintenanceRequestId?: { requestNumber?: string; title?: string; titleAr?: string } | null;
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
    activityByBuilding: Array<{ name: string; nameAr?: string; building: string; buildingAr?: string; maintenance: number; lostFound: number }>;
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
    titleAr?: string;
    status: WorkOrderStatus;
    priority: string;
    category: string;
    scheduledStart?: Date;
    expectedCompletion?: Date;
    overdue: boolean;
    location: {
      id: string;
      buildingName: string;
      buildingNameAr?: string;
      floor: string;
      floorAr?: string;
      room: string;
      roomAr?: string;
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
      titleAr?: string;
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
      itemTitleAr?: string;
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
      itemTitleAr?: string;
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

interface BuildingCountRow {
  _id: Types.ObjectId | string | null;
  name: string | null;
  nameAr?: string | null;
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

function localize(en: string | undefined, ar: string | undefined, lang: string): string {
  return lang === 'ar' && ar?.trim() ? ar : (en ?? '');
}

function formatInsightLocation(
  location: InsightLocationRef | null | undefined,
  lang: string,
): string {
  if (!location) {
    return 'Unassigned location';
  }

  const parts = [
    localize(location.buildingName, location.buildingNameAr, lang),
    localize(location.floor, location.floorAr, lang),
    localize(location.room, location.roomAr, lang),
  ].filter(Boolean);

  return parts.join(', ') || 'Unassigned location';
}

function ageInDays(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

async function getInsightOperationalDetails(
  range: PeriodRange,
  lang: string,
): Promise<{
  overdueWorkOrders: Array<Record<string, unknown>>;
  oldestOpenRequests: Array<Record<string, unknown>>;
  lowRatings: Array<Record<string, unknown>>;
}> {
  const openRequestStatuses: RequestStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'IN_PROGRESS',
    'REOPENED',
    'COMPLETED',
  ];

  const [overdueWorkOrders, oldestOpenRequests, lowRatings] = await Promise.all([
    WorkOrder.find({
      status: { $in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'] },
      expectedCompletion: { $lt: range.to },
    })
      .sort({ expectedCompletion: 1 })
      .limit(8)
      .populate('assignedTechnicianId', 'name')
      .populate('locationId', 'buildingName buildingNameAr floor floorAr room roomAr')
      .lean<InsightWorkOrderDetail[]>(),
    MaintenanceRequest.find({ status: { $in: openRequestStatuses } })
      .sort({ createdAt: 1 })
      .limit(8)
      .populate('locationId', 'buildingName buildingNameAr floor floorAr room roomAr')
      .lean<InsightRequestDetail[]>(),
    ServiceFeedback.find({ rating: { $lte: 3 }, ...createdAtMatch(range) })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('technicianId', 'name')
      .populate('maintenanceRequestId', 'requestNumber title titleAr')
      .lean<InsightFeedbackDetail[]>(),
  ]);

  return {
    overdueWorkOrders: overdueWorkOrders.map((workOrder) => ({
      code: workOrder.workOrderNumber,
      title: localize(workOrder.title, workOrder.titleAr, lang),
      priority: workOrder.priority,
      status: workOrder.status,
      technician: workOrder.assignedTechnicianId?.name ?? 'Unassigned',
      location: formatInsightLocation(workOrder.locationId, lang),
      daysOverdue: workOrder.expectedCompletion
        ? ageInDays(workOrder.expectedCompletion, range.to)
        : null,
    })),
    oldestOpenRequests: oldestOpenRequests.map((request) => ({
      code: request.requestNumber,
      title: localize(request.title, request.titleAr, lang),
      status: request.status,
      priority: request.priority,
      location: formatInsightLocation(request.locationId, lang),
      daysOpen: ageInDays(request.createdAt, range.to),
    })),
    lowRatings: lowRatings.map((feedback) => ({
      rating: feedback.rating,
      comment: localize(feedback.comment, feedback.commentAr, lang) || null,
      technician: feedback.technicianId?.name ?? 'Unknown technician',
      requestCode: feedback.maintenanceRequestId?.requestNumber ?? null,
      requestTitle: localize(
        feedback.maintenanceRequestId?.title,
        feedback.maintenanceRequestId?.titleAr,
        lang,
      ),
      createdAt: feedback.createdAt,
    })),
  };
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
      MaintenanceRequest.aggregate<BuildingCountRow>([
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
        {
          $group: {
            _id: '$location._id',
            name: { $first: '$location.buildingName' },
            nameAr: { $first: '$location.buildingNameAr' },
            count: { $sum: 1 },
          },
        },
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
      name: row.name ?? 'Unassigned location',
      nameAr: row.nameAr ?? undefined,
      building: row.name ?? 'Unassigned location',
      buildingAr: row.nameAr ?? undefined,
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
  const lang = getRequestLang();
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
    AiInsightCache.findOne({ lang })
      .sort({ generatedAt: -1 })
      .lean()
      .then((cached) => cached ?? AiInsightCache.findOne({}).sort({ generatedAt: -1 }).lean()),
    User.aggregate<CountRow>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    MaintenanceRequest.aggregate<BuildingCountRow>([
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
          _id: '$location._id',
          name: { $first: '$location.buildingName' },
          nameAr: { $first: '$location.buildingNameAr' },
          count: { $sum: 1 },
        },
      },
    ]),
    LostFoundItem.aggregate<BuildingCountRow>([
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
          _id: '$location._id',
          name: { $first: '$location.buildingName' },
          nameAr: { $first: '$location.buildingNameAr' },
          count: { $sum: 1 },
        },
      },
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

  const buildingActivityMap = new Map<string, { name: string; nameAr?: string; maintenance: number; lostFound: number }>();
  mrBuildingRows.forEach((row) => {
    if (!row.name) return;
    const key = row._id ? row._id.toString() : row.name;
    const current = buildingActivityMap.get(key) ?? {
      name: row.name,
      nameAr: row.nameAr ?? undefined,
      maintenance: 0,
      lostFound: 0,
    };
    current.maintenance = row.count;
    buildingActivityMap.set(key, current);
  });
  lfBuildingRows.forEach((row) => {
    if (!row.name) return;
    const key = row._id ? row._id.toString() : row.name;
    const current = buildingActivityMap.get(key) ?? {
      name: row.name,
      nameAr: row.nameAr ?? undefined,
      maintenance: 0,
      lostFound: 0,
    };
    current.lostFound = row.count;
    buildingActivityMap.set(key, current);
  });
  const activityByBuilding = Array.from(buildingActivityMap.values())
    .map((item) => ({
      name: item.name,
      nameAr: item.nameAr,
      building: item.name,
      buildingAr: item.nameAr,
      maintenance: item.maintenance,
      lostFound: item.lostFound,
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
      .populate('locationId', 'buildingName buildingNameAr floor floorAr room roomAr')
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
        | {
            _id: Types.ObjectId;
            buildingName: string;
            buildingNameAr?: string;
            floor: string;
            floorAr?: string;
            room: string;
            roomAr?: string;
          }
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
        titleAr: (workOrder as unknown as { titleAr?: string }).titleAr,
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
              buildingNameAr: location.buildingNameAr,
              floor: location.floor,
              floorAr: location.floorAr,
              room: location.room,
              roomAr: location.roomAr,
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
      .select('requestNumber title titleAr status priority createdAt')
      .lean(),
    ClaimRequest.aggregate<CountRow>([
      { $match: { claimantId: userId, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ClaimRequest.find({ claimantId: userId, ...rangeMatch })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('itemId', 'itemTitle itemTitleAr')
      .lean(),
    LostFoundItem.aggregate<CountRow>([
      { $match: { reporterId: userId, ...rangeMatch } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
    ]),
    LostFoundItem.find({ reporterId: userId, ...rangeMatch })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reportNumber reportType itemTitle itemTitleAr status createdAt')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type title message titleKey messageKey params linkUrl isRead createdAt')
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
        titleAr: (request as unknown as { titleAr?: string }).titleAr,
        status: request.status,
        priority: request.priority,
        createdAt: request.createdAt,
      })),
    },
    claims: {
      total: totalClaims,
      recent: recentClaims.map((claim) => {
        const item = claim.itemId as unknown as { itemTitle?: string; itemTitleAr?: string } | null;
        return {
          id: claim._id.toString(),
          claimNumber: claim.claimNumber,
          itemTitle: item?.itemTitle ?? 'Lost & found item',
          itemTitleAr: item?.itemTitleAr,
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
        itemTitleAr: (report as unknown as { itemTitleAr?: string }).itemTitleAr,
        status: report.status,
        createdAt: report.createdAt,
      })),
    },
    notifications: {
      unreadCount,
      recent: recentNotifications.map((notification) => {
        const localized = applyNotificationLocalization(notification);
        return {
          id: notification._id.toString(),
          title: localized.title,
          titleKey: localized.titleKey,
          message: localized.message,
          messageKey: localized.messageKey,
          params: localized.params,
          linkUrl: notification.linkUrl,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        };
      }),
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

  const lang = getRequestLang();
  const [metrics, previousTotalRequests, repeatedIssues, details] = await Promise.all([
    getManagerMetrics(range),
    countRequestsInRange(previousRange),
    getRepeatedLocationIssues(range),
    getInsightOperationalDetails(range, lang),
  ]);

  const totalRequests = metrics.totalRequests;
  const requestChangePercent =
    previousTotalRequests === 0
      ? totalRequests > 0
        ? 100
        : 0
      : round(((totalRequests - previousTotalRequests) / previousTotalRequests) * 100);

  const openBacklogStatuses: RequestStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'IN_PROGRESS',
    'REOPENED',
    'COMPLETED',
  ];
  const openBacklog = openBacklogStatuses.reduce(
    (sum, status) => sum + (metrics.requestsByStatus[status] ?? 0),
    0,
  );

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
      openBacklog,
      byStatus: metrics.requestsByStatus,
      byCategory: metrics.requestsByCategory.slice(0, 5),
      byBuilding: metrics.requestsByBuilding.slice(0, 5),
      repeatedLocationIssues: repeatedIssues,
      oldestOpen: details.oldestOpenRequests,
    },
    workOrders: {
      active: metrics.activeWorkOrders,
      completed: metrics.completedWorkOrders,
      overdue: metrics.overdueWorkOrders,
      averageResolutionHours: metrics.averageResolutionHours,
      overdueDetails: details.overdueWorkOrders,
    },
    technicians: metrics.technicianWorkload.map((technician) => ({
      name: technician.name,
      activeWorkOrders: technician.activeWorkOrders,
      completedWorkOrders: technician.completedWorkOrders,
      feedbackCount: technician.feedbackCount,
      averageRating: technician.averageRating,
    })),
    feedback: {
      ...metrics.feedback,
      lowRatings: details.lowRatings,
    },
  };

  return { stats, rangeStart, rangeEnd, previousRangeStart, previousRangeEnd };
}
