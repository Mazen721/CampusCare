import { Schema, model, models, type Model, type Types } from 'mongoose';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  RECURRENCE_TYPES,
  type MaintenanceCategory,
  type Priority,
  type RecurrenceType,
} from '../../config/constants';

export interface IPreventivePlan {
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  locationId: Types.ObjectId;
  assignedTechnicianId?: Types.ObjectId;
  recurrenceType: RecurrenceType;
  recurrenceIntervalDays?: number;
  startDate: Date;
  nextScheduledDate: Date;
  lastGeneratedDate?: Date;
  expectedDurationHours: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const preventivePlanSchema = new Schema<IPreventivePlan>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: MAINTENANCE_CATEGORIES },
    priority: { type: String, required: true, enum: PRIORITIES },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    recurrenceType: { type: String, required: true, enum: RECURRENCE_TYPES },
    recurrenceIntervalDays: { type: Number, min: 1 },
    startDate: { type: Date, required: true },
    nextScheduledDate: { type: Date, required: true },
    lastGeneratedDate: { type: Date },
    expectedDurationHours: { type: Number, required: true, min: 0.25 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

preventivePlanSchema.pre('validate', function (next) {
  if (this.recurrenceType === 'CUSTOM_DAYS' && !this.recurrenceIntervalDays) {
    this.invalidate(
      'recurrenceIntervalDays',
      'recurrenceIntervalDays is required when recurrenceType is CUSTOM_DAYS',
    );
  }
  next();
});

preventivePlanSchema.index({ isActive: 1, nextScheduledDate: 1 });

export const PreventivePlan =
  (models.PreventivePlan as Model<IPreventivePlan> | undefined) ??
  model<IPreventivePlan>('PreventivePlan', preventivePlanSchema);
