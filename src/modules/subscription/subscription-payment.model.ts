import mongoose, { Document, Schema, Types } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  REFUND_FAILED = 'REFUND_FAILED'
}

export enum SubscriptionPaymentType {
  NORMAL_PAYMENT = 'NORMAL_PAYMENT',
  AUTH = 'AUTH',
  CHARGE = 'CHARGE',
}

export interface ISubscriptionPayment extends Document {
  restaurantId: Types.ObjectId;
  orderId: string; // The gateway's order ID (or internal tracking ID)
  paymentId?: string;
  subscriptionId?: string;
  paymentSessionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentType: SubscriptionPaymentType;
  gateway?: string; // e.g., 'cashfree', 'mock'
  paidAt?: Date;
  expiresAt?: Date; // The new subscription expiry date this payment granted
  periodStart?: Date;
  periodEnd?: Date;
  failureReason?: string;
  refundedAmount: number;
  refundId?: string;
  refundStatus?: string;
  refundArn?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, sparse: true, index: true },
    subscriptionId: { type: String, index: true },
    paymentSessionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.CREATED },
    paymentType: { type: String, enum: Object.values(SubscriptionPaymentType), default: SubscriptionPaymentType.NORMAL_PAYMENT },
    gateway: { type: String },
    paidAt: { type: Date },
    expiresAt: { type: Date },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    failureReason: { type: String },
    refundedAmount: { type: Number, default: 0, min: 0 },
    refundId: { type: String },
    refundStatus: { type: String },
    refundArn: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SubscriptionPaymentSchema.index({ restaurantId: 1, createdAt: -1 });

export const SubscriptionPayment = mongoose.model<ISubscriptionPayment>('SubscriptionPayment', SubscriptionPaymentSchema);
