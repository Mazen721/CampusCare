import type { Role } from '@/types/auth';
import type {
  MaintenanceCategory,
  Priority,
  RequestStatus,
} from '@/types/meta';

export interface ImageAsset {
  url: string;
  publicId: string;
}

export interface RequestLocation {
  id: string;
  buildingName: string;
  buildingNameAr?: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
  locationType: string;
}

export interface RequestPerson {
  id: string;
  name: string;
  email?: string;
  department?: string;
  departmentAr?: string;
  role?: Role;
}

export interface RequestReviewer {
  id: string;
  name: string;
  role?: Role;
}

export interface SerializedWorkOrderSummary {
  id: string;
  workOrderNumber: string;
  title?: string;
  titleAr?: string;
  status: string;
  sourceType?: string;
  scheduledStart?: string;
  expectedCompletion?: string;
  assignedTechnician?: {
    id: string;
    name: string;
    availability?: string;
  } | null;
}

export interface MaintenanceRequestRecord {
  id: string;
  requestNumber: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: RequestStatus;
  equipmentDescription?: string;
  attachments: ImageAsset[];
  location: RequestLocation | null;
  requester: RequestPerson | null;
  reviewedBy: RequestReviewer | null;
  reviewedAt?: string;
  reviewNotes?: string;
  currentWorkOrder: SerializedWorkOrderSummary | null;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  locationId: string;
  equipmentDescription?: string;
  images: File[];
}

export type ReviewAction = 'UNDER_REVIEW' | 'APPROVE' | 'REJECT';

export interface ReviewRequestInput {
  action: ReviewAction;
  notes?: string;
}

export interface ReviewRequestResponse {
  request: MaintenanceRequestRecord;
  workOrder?: SerializedWorkOrderSummary;
}

export interface ListRequestsParams {
  status?: RequestStatus;
  priority?: Priority;
  category?: MaintenanceCategory;
  q?: string;
  page?: number;
  limit?: number;
}
