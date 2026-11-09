import type { MaintenanceCategory, Priority } from '@/types/meta';

export const RECURRENCE_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  DAILY: 'Every day',
  WEEKLY: 'Every week',
  MONTHLY: 'Every month',
  CUSTOM_DAYS: 'Custom interval',
};

export interface PreventivePlanRecord {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  location: {
    id: string;
    buildingName: string;
    buildingNameAr?: string;
    floor: string;
    floorAr?: string;
    room: string;
    roomAr?: string;
  } | null;
  assignedTechnician: {
    id: string;
    name: string;
    availability?: string;
  } | null;
  recurrenceType: RecurrenceType;
  recurrenceIntervalDays?: number;
  startDate: string;
  nextScheduledDate: string;
  lastGeneratedDate?: string;
  expectedDurationHours: number;
  isActive: boolean;
  overdue: boolean;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePreventivePlanInput {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  locationId: string;
  assignedTechnicianId?: string;
  recurrenceType: RecurrenceType;
  recurrenceIntervalDays?: number;
  startDate: string;
  expectedDurationHours: number;
  isActive?: boolean;
}

export type UpdatePreventivePlanInput = Omit<
  Partial<CreatePreventivePlanInput>,
  'assignedTechnicianId'
> & {
  assignedTechnicianId?: string | null;
};
