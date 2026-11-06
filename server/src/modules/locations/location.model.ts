import { Schema, model, models, type Model } from 'mongoose';
import { LOCATION_TYPES, type LocationType } from '../../config/constants';

export interface ILocation {
  buildingName: string;
  floor: string;
  room: string;
  locationType: LocationType;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    buildingName: { type: String, required: true, trim: true, maxlength: 120 },
    floor: { type: String, required: true, trim: true, maxlength: 40 },
    room: { type: String, required: true, trim: true, maxlength: 40 },
    locationType: { type: String, required: true, enum: LOCATION_TYPES },
    description: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

locationSchema.index({ buildingName: 1, floor: 1, room: 1 }, { unique: true });

export const Location =
  (models.Location as Model<ILocation> | undefined) ??
  model<ILocation>('Location', locationSchema);
