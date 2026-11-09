import type {
  Priority,
  RequestStatus,
  WorkOrderStatus,
} from '@/types/meta';
import type { Role } from '@/types/auth';
import type { InsightContent } from '@/types/insights';

export const DASHBOARD_PERIODS = ['7d', '30d', '90d', 'all'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

interface DashboardBase {
  period: DashboardPeriod;
  rangeStart: string | null;
  rangeEnd: string;
}

export interface TechnicianWorkload {
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
  requestsByBuilding: Array<{ name?: string; nameAr?: string; building: string; buildingAr?: string; count: number }>;
  activeWorkOrders: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
  averageResolutionHours: number | null;
  technicianWorkload: TechnicianWorkload[];
  feedback: {
    total: number;
    averageRating: number | null;
    distribution: Array<{ rating: number; count: number }>;
  };
}

export interface ManagerDashboard extends DashboardBase {
  role: 'MAINTENANCE_MANAGER';
  metrics: ManagerMetrics;
}

export interface AdminDashboard extends DashboardBase {
  role: 'SUPER_ADMIN';
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
    generatedAt: string;
    rangeStart: string;
    rangeEnd: string;
    insights: InsightContent;
  } | null;
  analytics: {
    usersByRole: Array<{ role: Role; count: number }>;
    activityByBuilding: Array<{ name?: string; nameAr?: string; building: string; buildingAr?: string; maintenance: number; lostFound: number }>;
    moduleVolume: Array<{ module: string; count: number }>;
  };
}

export interface TechnicianScheduleItem {
  id: string;
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  status: WorkOrderStatus;
  priority: Priority;
  category: string;
  scheduledStart?: string;
  expectedCompletion?: string;
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
}

export interface TechnicianDashboard extends DashboardBase {
  role: 'TECHNICIAN';
  counts: {
    assigned: number;
    inProgress: number;
    overdue: number;
    completed: number;
  };
  schedule: TechnicianScheduleItem[];
  analytics: {
    byPriority: Array<{ priority: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    averageResolutionHours: number | null;
    averageRating: number | null;
    feedbackCount: number;
  };
}

export interface OfficerDashboard extends DashboardBase {
  role: 'LOST_FOUND_OFFICER';
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

export interface StudentDashboard extends DashboardBase {
  role: 'STUDENT_EMPLOYEE';
  requests: {
    total: number;
    byStatus: Record<RequestStatus, number>;
    recent: Array<{
      id: string;
      requestNumber: string;
      title: string;
      status: RequestStatus;
      priority: Priority;
      createdAt: string;
    }>;
  };
  claims: {
    total: number;
    recent: Array<{
      id: string;
      claimNumber: string;
      itemTitle: string;
      status: string;
      createdAt: string;
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
      createdAt: string;
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
      createdAt: string;
    }>;
  };
}

export type DashboardResponse =
  | AdminDashboard
  | ManagerDashboard
  | TechnicianDashboard
  | OfficerDashboard
  | StudentDashboard;
