import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface IServiceFeedback {
  maintenanceRequestId: Types.ObjectId;
  workOrderId: Types.ObjectId;
  technicianId: Types.ObjectId;
  requesterId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const serviceFeedbackSchema = new Schema<IServiceFeedback>(
  {
    maintenanceRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'MaintenanceRequest',
      required: true,
    },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

serviceFeedbackSchema.index({ maintenanceRequestId: 1 }, { unique: true });
serviceFeedbackSchema.index({ technicianId: 1 });

export const ServiceFeedback =
  (models.ServiceFeedback as Model<IServiceFeedback> | undefined) ??
  model<IServiceFeedback>('ServiceFeedback', serviceFeedbackSchema);
