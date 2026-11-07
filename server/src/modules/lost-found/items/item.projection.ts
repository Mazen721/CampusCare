import type { Types } from 'mongoose';
import type {
  ItemStatus,
  LostFoundCategory,
  ReportType,
} from '../../../config/constants';
import type { ImageAsset } from '../../../shared/schemas/image.schema';

export interface PublicItemLocation {
  id: string;
  buildingName: string;
  floor: string;
  room: string;
  locationType?: string;
}

/**
 * The exact public surface from MASTER_SPEC section 6.1. No private
 * identification details, reporter id, or reporter contact details.
 */
export interface PublicItem {
  id: string;
  reportNumber: string;
  reportType: ReportType;
  itemTitle: string;
  description: string;
  category: LostFoundCategory;
  color?: string;
  brand?: string;
  location: PublicItemLocation | null;
  locationDetails: string;
  occurrenceDate: Date;
  images: ImageAsset[];
  status: ItemStatus;
}

interface PopulatedLocation {
  _id: Types.ObjectId | string;
  buildingName: string;
  floor: string;
  room: string;
  locationType?: string;
}

export interface ProjectableItem {
  _id: Types.ObjectId | string;
  reportNumber: string;
  reportType: ReportType;
  itemTitle: string;
  description: string;
  category: LostFoundCategory;
  color?: string;
  brand?: string;
  locationId?: Types.ObjectId | string | PopulatedLocation | null;
  locationDetails: string;
  occurrenceDate: Date;
  images?: ImageAsset[];
  status: ItemStatus;
}

function isPopulatedLocation(
  value: ProjectableItem['locationId'],
): value is PopulatedLocation {
  return Boolean(
    value &&
      typeof value === 'object' &&
      '_id' in value &&
      'buildingName' in value,
  );
}

/**
 * Maps a Lost & Found item document to the public projection. The input may
 * contain private fields; they are deliberately never copied to the result.
 */
export function toPublicItem(item: ProjectableItem): PublicItem {
  const location = isPopulatedLocation(item.locationId)
    ? {
        id: item.locationId._id.toString(),
        buildingName: item.locationId.buildingName,
        floor: item.locationId.floor,
        room: item.locationId.room,
        locationType: item.locationId.locationType,
      }
    : null;

  return {
    id: item._id.toString(),
    reportNumber: item.reportNumber,
    reportType: item.reportType,
    itemTitle: item.itemTitle,
    description: item.description,
    category: item.category,
    color: item.color,
    brand: item.brand,
    location,
    locationDetails: item.locationDetails,
    occurrenceDate: item.occurrenceDate,
    images: (item.images ?? []).map((image) => ({
      url: image.url,
      publicId: image.publicId,
    })),
    status: item.status,
  };
}
