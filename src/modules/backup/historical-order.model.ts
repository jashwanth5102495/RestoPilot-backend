import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHistoricalOrderItem {
  dishName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface IHistoricalOrder extends Document {
  restaurantId: Types.ObjectId;
  archiveId?: Types.ObjectId;
  orderNumber: string;
  originalCreatedAt: Date;
  items: IHistoricalOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  orderSource: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  tableName?: string;
  importedAt: Date;
}

const HistoricalOrderItemSchema = new Schema<IHistoricalOrderItem>({
  dishName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 5 },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const HistoricalOrderSchema = new Schema<IHistoricalOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    archiveId: { type: Schema.Types.ObjectId, ref: 'BackupRecord' },
    orderNumber: { type: String, required: true },
    originalCreatedAt: { type: Date, required: true },
    items: [HistoricalOrderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'CASH' },
    paymentStatus: { type: String, default: 'PAID' },
    orderStatus: { type: String, default: 'COMPLETED' },
    orderSource: { type: String, default: 'IN_STORE' },
    customerInfo: {
      name: { type: String },
      phone: { type: String },
      address: { type: String }
    },
    tableName: { type: String },
    importedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

HistoricalOrderSchema.index({ restaurantId: 1, archiveId: 1 });
HistoricalOrderSchema.index({ restaurantId: 1, originalCreatedAt: -1 });
HistoricalOrderSchema.index({ restaurantId: 1, orderNumber: 1 });

export const HistoricalOrder = mongoose.model<IHistoricalOrder>('HistoricalOrder', HistoricalOrderSchema);
