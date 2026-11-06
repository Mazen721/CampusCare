export interface ServiceFeedbackRecord {
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
  createdAt: string;
}

export interface PerTechnicianFeedbackSummary {
  technicianId: string;
  technicianName: string;
  averageRating: number;
  count: number;
}

export interface FeedbackListResponse {
  data: ServiceFeedbackRecord[];
  page: number;
  limit: number;
  total: number;
  averageRating?: number | null;
  perTechnician?: PerTechnicianFeedbackSummary[];
}

export interface CreateFeedbackInput {
  maintenanceRequestId: string;
  rating: number;
  comment?: string;
}

export interface ListFeedbackParams {
  technicianId?: string;
  maintenanceRequestId?: string;
  page?: number;
  limit?: number;
}
