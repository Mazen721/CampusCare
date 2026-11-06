import { Schema, model, models, type Model, type Types } from 'mongoose';
import {
  MATCH_LEVELS,
  MATCH_STATUSES,
  type MatchLevel,
  type MatchStatus,
} from '../../../config/constants';

export interface MatchBreakdown {
  category: number;
  location: number;
  date: number;
  color: number;
  brand: number;
  keywords: number;
}

export interface IItemMatch {
  lostItemId: Types.ObjectId;
  foundItemId: Types.ObjectId;
  score: number;
  level: MatchLevel;
  breakdown: MatchBreakdown;
  status: MatchStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const breakdownSchema = new Schema<MatchBreakdown>(
  {
    category: { type: Number, required: true, min: 0, max: 1 },
    location: { type: Number, required: true, min: 0, max: 1 },
    date: { type: Number, required: true, min: 0, max: 1 },
    color: { type: Number, required: true, min: 0, max: 1 },
    brand: { type: Number, required: true, min: 0, max: 1 },
    keywords: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false },
);

const itemMatchSchema = new Schema<IItemMatch>(
  {
    lostItemId: { type: Schema.Types.ObjectId, ref: 'LostFoundItem', required: true },
    foundItemId: { type: Schema.Types.ObjectId, ref: 'LostFoundItem', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    level: { type: String, required: true, enum: MATCH_LEVELS },
    breakdown: { type: breakdownSchema, required: true },
    status: { type: String, required: true, enum: MATCH_STATUSES, default: 'SUGGESTED' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

itemMatchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });
itemMatchSchema.index({ status: 1 });

export const ItemMatch =
  (models.ItemMatch as Model<IItemMatch> | undefined) ??
  model<IItemMatch>('ItemMatch', itemMatchSchema);
