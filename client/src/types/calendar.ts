import type { MaintenanceCategory, Priority, WorkOrderStatus } from '@/types/meta';

export interface CalendarTechnician {
  id: string;
  name: string;
  availability?: string;
}

export interface CalendarLocation {
  id: string;
  buildingName: string;
  floor: string;
  room: string;
}

export interface CalendarWorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  status: WorkOrderStatus;
  sourceType: 'REACTIVE' | 'PREVENTIVE';
  priority: Priority;
  category: MaintenanceCategory;
  scheduledStart?: string;
  expectedCompletion?: string;
  completedAt?: string;
  overdue: boolean;
  assignedTechnician: CalendarTechnician | null;
  location: CalendarLocation | null;
}

export interface CalendarResponse {
  data: CalendarWorkOrder[];
  from: string;
  to: string;
}

export interface ListCalendarParams {
  from?: string;
  to?: string;
  technicianId?: string;
  status?: WorkOrderStatus;
}
