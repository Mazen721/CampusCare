import { Schema, model, models, type Model, type Types } from 'mongoose';
import {
  ITEM_STATUSES,
  LOST_FOUND_CATEGORIES,
  REPORT_TYPES,
  type ItemStatus,
  type LostFoundCategory,
  type ReportType,
} from '../../../config/constants';
import {
  MAX_IMAGES_MESSAGE,
  imageSchema,
  maxImagesValidator,
  type ImageAsset,
} from '../../../shared/schemas/image.schema';

export interface ILostFoundItem {
  reportNumber: string;
  reportType: ReportType;
  itemTitle: string;
  description: string;
  privateIdentificationDetails: string;
  category: LostFoundCategory;
  color?: string;
  brand?: string;
  locationId: Types.ObjectId;
  locationDetails: string;
  occurrenceDate: Date;
  images: ImageAsset[];
  reporterId: Types.ObjectId;
  status: ItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

const lostFoundItemSchema = new Schema<ILostFoundItem>(
  {
    reportNumber: { type: String, required: true, trim: true },
    reportType: { type: String, required: true, enum: REPORT_TYPES },
    itemTitle: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    privateIdentificationDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
      select: false,
    },
    category: { type: String, required: true, enum: LOST_FOUND_CATEGORIES },
    color: { type: String, trim: true, maxlength: 60 },
    brand: { type: String, trim: true, maxlength: 80 },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    locationDetails: { type: String, required: true, trim: true, maxlength: 500 },
    occurrenceDate: { type: Date, required: true },
    images: {
      type: [imageSchema],
      default: [],
      validate: { validator: maxImagesValidator, message: MAX_IMAGES_MESSAGE },
    },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: ITEM_STATUSES, default: 'OPEN' },
  },
  { timestamps: true, versionKey: false },
);

lostFoundItemSchema.index({ reportNumber: 1 }, { unique: true });
lostFoundItemSchema.index({ reportType: 1, status: 1, category: 1 });
lostFoundItemSchema.index({ itemTitle: 'text', description: 'text' });
lostFoundItemSchema.index({ occurrenceDate: 1 });

export const LostFoundItem =
  (models.LostFoundItem as Model<ILostFoundItem> | undefined) ??
  model<ILostFoundItem>('LostFoundItem', lostFoundItemSchema);
