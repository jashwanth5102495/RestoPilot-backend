import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubscriptionWebhookEvent extends Document {
  eventKey: string;
  eventType: string;
  restaurantId?: Types.ObjectId;
  subscriptionId?: string;
  paymentId?: string;
  payload: Record<string, unknown>;
  processedAt: Date;
  createdAt: Date;
}

const SubscriptionWebhookEventSchema = new Schema<ISubscriptionWebhookEvent>(
  {
    eventKey: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    subscriptionId: { type: String },
    paymentId: { type: String },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SubscriptionWebhookEvent = mongoose.model<ISubscriptionWebhookEvent>(
  'SubscriptionWebhookEvent',
  SubscriptionWebhookEventSchema
);
