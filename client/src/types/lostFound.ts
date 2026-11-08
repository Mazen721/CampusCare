import type { ImageAsset } from '@/types/maintenance';
import type { Role } from '@/types/auth';

export const LOST_FOUND_CATEGORIES = [
  'Electronics',
  'Phones',
  'Laptops',
  'Headphones',
  'Wallets',
  'Bags',
  'Keys',
  'Documents',
  'Accessories',
  'Books',
  'Clothing',
  'Other',
] as const;
export type LostFoundCategory = (typeof LOST_FOUND_CATEGORIES)[number];

export const REPORT_TYPES = ['LOST', 'FOUND'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const ITEM_STATUSES = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
  'APPROVED_FOR_HANDOVER',
  'RETURNED',
  'CLOSED',
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ACTIVE_BROWSE_STATUSES = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
] as const;

export const ARCHIVED_ITEM_STATUSES = [
  'APPROVED_FOR_HANDOVER',
  'RETURNED',
  'CLOSED',
] as const;

export interface LostFoundLocation {
  id: string;
  buildingName: string;
  floor: string;
  room: string;
  locationType?: string;
}

export interface LostFoundReporter {
  id: string;
  name: string;
  email?: string;
  department?: string;
  role?: Role;
}

export interface LostFoundItem {
  id: string;
  reportNumber: string;
  reportType: ReportType;
  itemTitle: string;
  description: string;
  category: LostFoundCategory;
  color?: string;
  brand?: string;
  location: LostFoundLocation | null;
  locationDetails: string;
  occurrenceDate: string;
  images: ImageAsset[];
  status: ItemStatus;
  privateIdentificationDetails?: string;
  reporter?: LostFoundReporter | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLostFoundItemInput {
  reportType: ReportType;
  itemTitle: string;
  description: string;
  privateIdentificationDetails: string;
  category: LostFoundCategory;
  color?: string;
  brand?: string;
  locationId: string;
  locationDetails: string;
  occurrenceDate: string;
  images: File[];
}

export interface UpdateLostFoundItemInput {
  itemTitle?: string;
  description?: string;
  privateIdentificationDetails?: string;
  category?: LostFoundCategory;
  color?: string;
  brand?: string;
  locationId?: string;
  locationDetails?: string;
  occurrenceDate?: string;
  status?: 'CLOSED';
}

export interface ListLostFoundItemsParams {
  q?: string;
  category?: LostFoundCategory;
  reportType?: ReportType;
  locationId?: string;
  building?: string;
  from?: string;
  to?: string;
  color?: string;
  brand?: string;
  status?: ItemStatus;
  scope?: 'active' | 'archived' | 'all';
  mine?: boolean;
  page?: number;
  limit?: number;
}
