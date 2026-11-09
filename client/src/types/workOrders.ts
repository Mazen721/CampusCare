import type { MaintenanceCategory, Priority, WorkOrderStatus } from '@/types/meta';

export interface WorkOrderTechnician {
  id: string;
  name: string;
  email: string;
  availability?: string;
  specializations?: MaintenanceCategory[];
}

export interface WorkOrderLocation {
  id: string;
  buildingName: string;
  buildingNameAr?: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
  locationType?: string;
}

export interface WorkOrderNote {
  note: string;
  noteAr?: string;
  author: {
    id: string;
    name: string;
    role?: string;
  };
  createdAt: string;
  isSystem: boolean;
}

export interface WorkOrderRecord {
  id: string;
  workOrderNumber: string;
  sourceType: 'REACTIVE' | 'PREVENTIVE';
  maintenanceRequestId?: string;
  preventivePlanId?: string;
  assignedTechnician?: WorkOrderTechnician | null;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  location: WorkOrderLocation | null;
  status: WorkOrderStatus;
  aiSummary?: {
    text: string;
    generatedAt: string;
  };
  scheduledStart?: string;
  expectedCompletion?: string;
  actualStart?: string;
  completedAt?: string;
  technicianNotes: WorkOrderNote[];
  resolutionDetails?: string;
  resolutionDetailsAr?: string;
  cancelReason?: string;
  cancelReasonAr?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignWorkOrderInput {
  technicianId: string;
  scheduledStart: string;
  expectedCompletion: string;
}

export interface AddNoteInput {
  note: string;
}

export interface CompleteWorkOrderInput {
  resolutionDetails: string;
}

export interface CancelWorkOrderInput {
  reason: string;
}

export interface ListWorkOrdersParams {
  status?: WorkOrderStatus;
  technicianId?: string;
  sourceType?: 'REACTIVE' | 'PREVENTIVE';
  page?: number;
  limit?: number;
}
