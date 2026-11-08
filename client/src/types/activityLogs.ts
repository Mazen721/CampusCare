import type { Role } from '@/types/auth';

export const ACTIVITY_ENTITY_TYPES = [
  'User',
  'Location',
  'MaintenanceRequest',
  'WorkOrder',
  'PreventivePlan',
  'ServiceFeedback',
  'LostFoundItem',
  'ItemMatch',
  'ClaimRequest',
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export interface ActivityLogRecord {
  id: string;
  actor: {
    id: string;
    name: string;
    email?: string;
    role?: Role;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
