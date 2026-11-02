import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDrinkItem extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  price: number;
  category: string;
  currentStock: number;
  unit: string;
  cost?: number;
  minStock?: number;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDrinkStockLog extends Document {
  restaurantId: Types.ObjectId;
  drinkId: Types.ObjectId;
  drinkName: string;
  type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT';
  quantityChange: number;
  stockAfter: number;
  notes?: string;
  referenceId?: string;
  createdAt: Date;
}

const DrinkItemSchema = new Schema<IDrinkItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Drinks', trim: true },
    currentStock: { type: Number, default: 0 },
    unit: { type: String, default: 'bottle', trim: true },
    cost: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DrinkItemSchema.index({ restaurantId: 1, isDeleted: 1 });
DrinkItemSchema.index({ restaurantId: 1, name: 1 }, { partialFilterExpression: { isDeleted: false } });

const DrinkStockLogSchema = new Schema<IDrinkStockLog>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    drinkId: { type: Schema.Types.ObjectId, ref: 'DrinkItem', required: true },
    drinkName: { type: String, required: true },
    type: { type: String, enum: ['RESTOCK', 'SALE', 'ADJUSTMENT'], required: true },
    quantityChange: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    notes: { type: String },
    referenceId: { type: String },
  },
  { timestamps: true }
);

DrinkStockLogSchema.index({ restaurantId: 1, drinkId: 1, createdAt: -1 });

export const DrinkItem = mongoose.model<IDrinkItem>('DrinkItem', DrinkItemSchema);
export const DrinkStockLog = mongoose.model<IDrinkStockLog>('DrinkStockLog', DrinkStockLogSchema);
