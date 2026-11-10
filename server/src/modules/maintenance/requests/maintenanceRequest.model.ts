import { Schema, model, models, type Model, type Types } from 'mongoose';
import {
  MAINTENANCE_CATEGORIES,
  PRIORITIES,
  REQUEST_STATUSES,
  type MaintenanceCategory,
  type Priority,
  type RequestStatus,
} from '../../../config/constants';
import {
  MAX_IMAGES_MESSAGE,
  imageSchema,
  maxImagesValidator,
  type ImageAsset,
} from '../../../shared/schemas/image.schema';

export interface IMaintenanceRequest {
  requestNumber: string;
  requesterId: Types.ObjectId;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  locationId: Types.ObjectId;
  equipmentDescription?: string;
  equipmentDescriptionAr?: string;
  attachments: ImageAsset[];
  status: RequestStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  reviewNotesAr?: string;
  currentWorkOrderId?: Types.ObjectId;
  reopenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    requestNumber: { type: String, required: true, trim: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    titleAr: { type: String, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    descriptionAr: { type: String, trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: MAINTENANCE_CATEGORIES },
    priority: { type: String, required: true, enum: PRIORITIES },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    equipmentDescription: { type: String, trim: true, maxlength: 1000 },
    equipmentDescriptionAr: { type: String, trim: true, maxlength: 1000 },
    attachments: {
      type: [imageSchema],
      default: [],
      validate: { validator: maxImagesValidator, message: MAX_IMAGES_MESSAGE },
    },
    status: { type: String, required: true, enum: REQUEST_STATUSES, default: 'SUBMITTED' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true, maxlength: 2000 },
    reviewNotesAr: { type: String, trim: true, maxlength: 2000 },
    currentWorkOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    reopenCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

maintenanceRequestSchema.index({ requestNumber: 1 }, { unique: true });
maintenanceRequestSchema.index({ requesterId: 1, createdAt: -1 });
maintenanceRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
maintenanceRequestSchema.index({ locationId: 1 });

export const MaintenanceRequest =
  (models.MaintenanceRequest as Model<IMaintenanceRequest> | undefined) ??
  model<IMaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema);
