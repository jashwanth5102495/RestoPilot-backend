import mongoose, { Document, Schema, Types } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export interface ISubscriptionPayment extends Document {
  restaurantId: Types.ObjectId;
  orderId: string; // The gateway's order ID (or internal tracking ID)
  paymentSessionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway?: string; // e.g., 'cashfree', 'mock'
  paidAt?: Date;
  expiresAt?: Date; // The new subscription expiry date this payment granted
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: String, required: true, unique: true },
    paymentSessionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.CREATED },
    gateway: { type: String },
    paidAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

SubscriptionPaymentSchema.index({ restaurantId: 1, createdAt: -1 });

export const SubscriptionPayment = mongoose.model<ISubscriptionPayment>('SubscriptionPayment', SubscriptionPaymentSchema);
