import { Schema, model, models, type Model, type Types } from 'mongoose';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  SOURCE_TYPES,
  WORK_ORDER_STATUSES,
  type MaintenanceCategory,
  type Priority,
  type SourceType,
  type WorkOrderStatus,
} from '../../../config/constants';

export interface AiSummary {
  text: string;
  generatedAt: Date;
}

export interface TechnicianNote {
  note: string;
  authorId: Types.ObjectId;
  createdAt: Date;
  isSystem: boolean;
}

export interface IWorkOrder {
  workOrderNumber: string;
  sourceType: SourceType;
  maintenanceRequestId?: Types.ObjectId;
  preventivePlanId?: Types.ObjectId;
  assignedTechnicianId?: Types.ObjectId;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  locationId: Types.ObjectId;
  status: WorkOrderStatus;
  aiSummary?: AiSummary;
  scheduledStart?: Date;
  expectedCompletion?: Date;
  actualStart?: Date;
  completedAt?: Date;
  technicianNotes: TechnicianNote[];
  resolutionDetails?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiSummarySchema = new Schema<AiSummary>(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    generatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const technicianNoteSchema = new Schema<TechnicianNote>(
  {
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    isSystem: { type: Boolean, default: false },
  },
  { _id: false },
);

const workOrderSchema = new Schema<IWorkOrder>(
  {
    workOrderNumber: { type: String, required: true, trim: true },
    sourceType: { type: String, required: true, enum: SOURCE_TYPES },
    maintenanceRequestId: { type: Schema.Types.ObjectId, ref: 'MaintenanceRequest' },
    preventivePlanId: { type: Schema.Types.ObjectId, ref: 'PreventivePlan' },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: MAINTENANCE_CATEGORIES },
    priority: { type: String, required: true, enum: PRIORITIES },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    status: {
      type: String,
      required: true,
      enum: WORK_ORDER_STATUSES,
      default: 'PENDING_ASSIGNMENT',
    },
    aiSummary: { type: aiSummarySchema },
    scheduledStart: { type: Date },
    expectedCompletion: { type: Date },
    actualStart: { type: Date },
    completedAt: { type: Date },
    technicianNotes: { type: [technicianNoteSchema], default: [] },
    resolutionDetails: { type: String, trim: true, maxlength: 4000 },
    cancelReason: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false },
);

workOrderSchema.pre('validate', function (next) {
  if (this.sourceType === 'REACTIVE' && !this.maintenanceRequestId) {
    this.invalidate('maintenanceRequestId', 'A reactive work order requires a maintenance request');
  }
  if (this.sourceType === 'PREVENTIVE' && !this.preventivePlanId) {
    this.invalidate('preventivePlanId', 'A preventive work order requires a preventive plan');
  }
  next();
});

workOrderSchema.index({ workOrderNumber: 1 }, { unique: true });
workOrderSchema.index({ assignedTechnicianId: 1, status: 1 });
workOrderSchema.index({ status: 1, expectedCompletion: 1 });
workOrderSchema.index({ maintenanceRequestId: 1 });
workOrderSchema.index(
  { preventivePlanId: 1, scheduledStart: 1 },
  {
    unique: true,
    partialFilterExpression: { preventivePlanId: { $type: 'objectId' } },
  },
);

export const WorkOrder =
  (models.WorkOrder as Model<IWorkOrder> | undefined) ??
  model<IWorkOrder>('WorkOrder', workOrderSchema);
