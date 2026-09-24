import mongoose, { Document, Schema, Types } from 'mongoose';

export enum RestaurantSubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
  ADMIN_DISABLED = 'ADMIN_DISABLED',
}

export enum SubscriptionPaymentMode {
  NORMAL = 'NORMAL',
  AUTOPAY = 'AUTOPAY',
}

export enum MandateStatus {
  NOT_ENABLED = 'NOT_ENABLED',
  AUTHORIZATION_PENDING = 'AUTHORIZATION_PENDING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type SubscriptionIntervalType = 'MONTH' | 'YEAR';

export interface IRestaurantSubscription extends Document {
  restaurantId: Types.ObjectId;
  amount: number;
  currency: string;
  usesDefaultPrice: boolean;
  intervalCount: number;
  intervalType: SubscriptionIntervalType;
  status: RestaurantSubscriptionStatus;
  paymentMode: SubscriptionPaymentMode;
  cashfreePlanId?: string;
  cashfreeSubscriptionId?: string;
  mandateStatus: MandateStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextChargeAt?: Date;
  chargeProcessing: boolean;
  lastChargeAttemptAt?: Date;
  lastPaymentId?: string;
  pendingAmount?: number;
  pendingAmountEffectiveAt?: Date;
  accessEnabled: boolean;
  cancelledAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSubscriptionSchema = new Schema<IRestaurantSubscription>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    usesDefaultPrice: { type: Boolean, default: true },
    intervalCount: { type: Number, default: 1, min: 1 },
    intervalType: { type: String, enum: ['MONTH', 'YEAR'], default: 'MONTH' },
    status: { type: String, enum: Object.values(RestaurantSubscriptionStatus), default: RestaurantSubscriptionStatus.PENDING },
    paymentMode: { type: String, enum: Object.values(SubscriptionPaymentMode), default: SubscriptionPaymentMode.NORMAL },
    cashfreePlanId: { type: String },
    cashfreeSubscriptionId: { type: String, sparse: true, index: true },
    mandateStatus: { type: String, enum: Object.values(MandateStatus), default: MandateStatus.NOT_ENABLED },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    nextChargeAt: { type: Date },
    chargeProcessing: { type: Boolean, default: false },
    lastChargeAttemptAt: { type: Date },
    lastPaymentId: { type: String },
    pendingAmount: { type: Number, min: 0 },
    pendingAmountEffectiveAt: { type: Date },
    accessEnabled: { type: Boolean, default: true },
    cancelledAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export const RestaurantSubscription = mongoose.model<IRestaurantSubscription>(
  'RestaurantSubscription',
  RestaurantSubscriptionSchema
);
