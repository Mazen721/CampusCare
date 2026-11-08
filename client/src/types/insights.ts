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
  };
  workOrders?: {
    active: number;
    completed: number;
    overdue: number;
    averageResolutionHours: number | null;
  };
  technicians?: Array<{
    label: string;
    activeWorkOrders: number;
    completedWorkOrders: number;
    feedbackCount: number;
    averageRating: number | null;
  }>;
  feedback?: {
    total: number;
    averageRating: number | null;
    distribution: Array<{ rating: number; count: number }>;
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
