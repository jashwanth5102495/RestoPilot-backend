import mongoose, { Document, Schema, Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENT = 'AGENT',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER', // Keeping CASHIER for legacy support
  BILLING = 'BILLING',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface IUser extends Document {
  restaurantId?: Types.ObjectId;
  name: string;
  email?: string;
  loginId?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, sparse: true },
    loginId: { type: String },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    avatar: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Users are unique per restaurant by email. If restaurantId is null (e.g. Super Admin), email is unique globally.
UserSchema.index({ restaurantId: 1, email: 1 }, { unique: true, sparse: true });
UserSchema.index({ restaurantId: 1, loginId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
