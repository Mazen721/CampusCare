import type { LocationType } from '@/types/meta';

export interface LocationRecord {
  id: string;
  buildingName: string;
  buildingNameAr?: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
  locationType: LocationType;
  description?: string;
  descriptionAr?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  buildingName: string;
  buildingNameAr: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
  locationType: LocationType;
  description?: string;
  descriptionAr?: string;
}

export type UpdateLocationInput = Partial<CreateLocationInput>;
