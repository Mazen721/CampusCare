import { Schema, model, models, type Model } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: false, versionKey: false },
);

export const Counter =
  (models.Counter as Model<ICounter> | undefined) ?? model<ICounter>('Counter', counterSchema);
