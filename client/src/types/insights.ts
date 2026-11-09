export interface InsightContent {
  observations: string[];
  repeatedPatterns: string[];
  operationalRisks: string[];
  preventiveRecommendations: string[];
}

export interface InsightStats {
  period?: string;
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
