import type { LocationType } from '@/types/meta';

export interface LocationRecord {
  id: string;
  buildingName: string;
  floor: string;
  room: string;
  locationType: LocationType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  buildingName: string;
  floor: string;
  room: string;
  locationType: LocationType;
  description?: string;
}

export type UpdateLocationInput = Partial<CreateLocationInput>;
