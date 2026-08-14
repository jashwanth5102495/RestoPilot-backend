import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TransactionType {
  OPENING_STOCK = 'OPENING_STOCK',
  PURCHASE = 'PURCHASE',
  SALE_CONSUMPTION = 'SALE_CONSUMPTION',
  WASTAGE = 'WASTAGE',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  RETURN = 'RETURN',
  REVERSAL = 'REVERSAL'
}

export interface IInventoryTransaction extends Document {
  restaurantId: Types.ObjectId;
  ingredientId: Types.ObjectId;
  type: TransactionType;
  quantity: number; // Positive for IN, Negative for OUT (in base unit)
  unit: string;
  referenceType?: string; // e.g., 'ORDER', 'PURCHASE', 'MANUAL'
  referenceId?: Types.ObjectId;
  balanceAfter: number;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    balanceAfter: { type: Number, required: true, min: 0 },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });
InventoryTransactionSchema.index({ restaurantId: 1, referenceId: 1 });

export const InventoryTransaction = mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
