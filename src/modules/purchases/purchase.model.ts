import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentStatus } from '../orders/order.model';

export interface IPurchaseItem {
  ingredientId: Types.ObjectId;
  quantity: number; // in base unit
  unit: string;
  unitCost: number; // Cost per base unit
  lineTotal: number;
}

export interface IPurchase extends Document {
  restaurantId: Types.ObjectId;
  purchaseNumber: string;
  supplierId?: Types.ObjectId;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  purchaseDate: Date;
  invoiceNumber?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, required: true },
  unitCost: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const PurchaseSchema = new Schema<IPurchase>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    purchaseNumber: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    purchaseDate: { type: Date, default: Date.now },
    invoiceNumber: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PurchaseSchema.index({ restaurantId: 1, purchaseNumber: 1 }, { unique: true });
PurchaseSchema.index({ restaurantId: 1, purchaseDate: -1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);
