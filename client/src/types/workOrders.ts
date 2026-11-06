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
  floor: string;
  room: string;
  locationType?: string;
}

export interface WorkOrderNote {
  note: string;
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
  description: string;
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
  cancelReason?: string;
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
