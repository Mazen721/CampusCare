import type { Role, TechnicianAvailability } from '@/types/auth';

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const MAINTENANCE_CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Electrical',
  'Plumbing',
  'Air Conditioning',
  'Furniture',
  'General Maintenance',
  'Other',
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const REQUEST_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'REOPENED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const WORK_ORDER_STATUSES = [
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const LOCATION_TYPES = ['BUILDING', 'FLOOR', 'ROOM', 'LAB', 'OTHER'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const TECHNICIAN_AVAILABILITIES = ['AVAILABLE', 'BUSY', 'OFF_DUTY'] as const;

export type MatchLevel = 'STRONG' | 'POSSIBLE';

export interface Meta {
  roles: Role[];
  priorities: Priority[];
  maintenanceCategories: MaintenanceCategory[];
  lostFoundCategories: string[];
  requestStatuses: RequestStatus[];
  workOrderStatuses: string[];
  itemStatuses: string[];
  claimStatuses: string[];
  matchStatuses: string[];
  matchLevels: MatchLevel[];
  reportTypes: string[];
  sourceTypes: string[];
  recurrenceTypes: string[];
  technicianAvailabilities: TechnicianAvailability[];
  locationTypes: LocationType[];
  matching: {
    weights: Record<string, number>;
    thresholds: Record<MatchLevel, number>;
  };
  uploads: {
    maxImages: number;
    maxBytes: number;
    mimeTypes: string[];
  };
}
