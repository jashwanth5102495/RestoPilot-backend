import mongoose, { Document, Schema, Types } from 'mongoose';
import { IOrderItem, PaymentMethod, PaymentStatus } from '../orders/order.model';

export enum BillStatus {
  ACTIVE = 'ACTIVE',
  VOID = 'VOID', // For cancellations
  REFUNDED = 'REFUNDED'
}

export interface IBill extends Document {
  restaurantId: Types.ObjectId;
  billNumber: string;
  orderId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  cgst?: number;
  sgst?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BillStatus;
  issuedAt: Date;
  issuedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IOrderItem>({
  dishId: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },
  dishName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const BillSchema = new Schema<IBill>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    billNumber: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    items: [BillItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PAID },
    status: { type: String, enum: Object.values(BillStatus), default: BillStatus.ACTIVE },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BillSchema.index({ restaurantId: 1, billNumber: 1 }, { unique: true });
BillSchema.index({ restaurantId: 1, issuedAt: -1 });
BillSchema.index({ orderId: 1 });

export const Bill = mongoose.model<IBill>('Bill', BillSchema);
