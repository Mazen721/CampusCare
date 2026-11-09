import { Schema, model, models, type HydratedDocument, type Model } from 'mongoose';
import {
  MAINTENANCE_CATEGORIES,
  ROLES,
  TECHNICIAN_AVAILABILITIES,
  type Role,
  type TechnicianAvailability,
} from '../../config/constants';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department?: string;
  departmentAr?: string;
  contactPhone?: string;
  isActive: boolean;
  specializations: string[];
  skills: string[];
  availability?: TechnicianAvailability;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    department: { type: String, trim: true, maxlength: 120 },
    departmentAr: { type: String, trim: true, maxlength: 120 },
    contactPhone: { type: String, trim: true, maxlength: 40 },
    isActive: { type: Boolean, default: true },
    specializations: {
      type: [String],
      enum: MAINTENANCE_CATEGORIES,
      default: [],
    },
    skills: { type: [String], default: [] },
    availability: { type: String, enum: TECHNICIAN_AVAILABILITIES },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, returned) => {
        const safe = returned as unknown as Record<string, unknown>;
        delete safe.passwordHash;
        return safe;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export const User =
  (models.User as Model<IUser> | undefined) ?? model<IUser>('User', userSchema);
