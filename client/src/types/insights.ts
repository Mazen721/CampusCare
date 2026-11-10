export interface InsightContent {
  observations: string[];
  repeatedPatterns: string[];
  operationalRisks: string[];
  preventiveRecommendations: string[];
}

export interface InsightStats {
  scope?: 'MAINTENANCE' | 'ADMIN';
  period?: string;
  users?: {
    total: number;
    active: number;
    inactive: number;
    technicians: number;
    byRole?: Array<{ role: string; count: number }>;
    inactiveAccounts?: Array<{
      name: string;
      email: string;
      role: string;
      department?: string;
    }>;
    technicianRoster?: Array<{
      name: string;
      availability: string;
      specializations: string[];
      activeWorkOrders: number;
      completedWorkOrders: number;
      averageRating: number | null;
    }>;
  };
  locations?: {
    activeLocations: number;
    inactiveLocations: number;
    buildings: number;
    activityByBuilding?: Array<{
      building: string;
      maintenanceRequests: number;
      lostFoundReports: number;
      totalActivity: number;
    }>;
  };
  maintenance?: {
    totalRequestsAllTime: number;
    totalWorkOrdersAllTime: number;
    requestsInPeriod: number;
    previousPeriodRequests: number;
    changePercent: number;
    openBacklog: number;
    activeWorkOrders: number;
    completedWorkOrders: number;
    overdueWorkOrders: number;
    averageResolutionHours: number | null;
    overdueDetails?: Array<{
      code: string;
      title: string;
      priority: string;
      status: string;
      technician: string;
      location: string;
      daysOverdue: number | null;
    }>;
    duePreventivePlans?: Array<{
      title: string;
      category: string;
      priority: string;
      recurrenceType: string;
      technician: string;
      location: string;
      daysOverdue: number;
    }>;
    feedbackAverage?: number | null;
  };
  lostFound?: {
    totalLostItems: number;
    totalFoundItems: number;
    openLostItems: number;
    openFoundItems: number;
    pendingMatchesCount: number;
    pendingClaimsCount: number;
    claimsAwaitingHandover: number;
    completedHandovers: number;
    suggestedMatches?: Array<{
      score: number;
      level: string;
      lostCode: string | null;
      lostTitle: string;
      foundCode: string | null;
      foundTitle: string;
    }>;
    activeClaims?: Array<{
      code: string;
      status: string;
      claimant: string;
      itemCode: string | null;
      itemTitle: string;
      daysOpen: number;
    }>;
  };
  recentActivity?: Array<{
    action: string;
    entityType: string;
    actor: string;
    actorRole: string | null;
    description: string;
    createdAt: string;
  }>;
  requests?: {
    total: number;
    previousTotal: number;
    changePercent: number;
    openBacklog?: number;
    byStatus?: Record<string, number>;
    byCategory?: Array<{ category: string; count: number }>;
    byBuilding?: Array<{ building: string; count: number }>;
    repeatedLocationIssues?: Array<{
      building: string;
      floor: string;
      room: string;
      category: string;
      count: number;
    }>;
    oldestOpen?: Array<{
      code: string;
      title: string;
      status: string;
      priority: string;
      location: string;
      daysOpen: number;
    }>;
  };
  workOrders?: {
    active: number;
    completed: number;
    overdue: number;
    averageResolutionHours: number | null;
    overdueDetails?: Array<{
      code: string;
      title: string;
      priority: string;
      status: string;
      technician: string;
      location: string;
      daysOverdue: number | null;
    }>;
  };
  technicians?: Array<{
    name: string;
    activeWorkOrders: number;
    completedWorkOrders: number;
    feedbackCount: number;
    averageRating: number | null;
  }>;
  feedback?: {
    total: number;
    averageRating: number | null;
    distribution: Array<{ rating: number; count: number }>;
    lowRatings?: Array<{
      rating: number;
      comment: string | null;
      technician: string;
      requestCode: string | null;
      requestTitle: string;
      createdAt: string;
    }>;
  };
}

export interface MaintenanceInsightsResponse {
  available: boolean;
  stats: InsightStats;
  insights?: InsightContent;
  generatedAt?: string;
  rangeStart: string;
  rangeEnd: string;
  message?: string;
}
