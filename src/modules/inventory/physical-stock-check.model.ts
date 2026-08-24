import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPhysicalStockCheck extends Document {
  restaurantId: Types.ObjectId;
  ingredientId: Types.ObjectId;
  ingredientName: string;
  estimatedQuantity: number;
  actualQuantity: number;
  variance: number;
  variancePercentage: number;
  unit: string;
  reason?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PhysicalStockCheckSchema = new Schema<IPhysicalStockCheck>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String, required: true },
    estimatedQuantity: { type: Number, required: true },
    actualQuantity: { type: Number, required: true },
    variance: { type: Number, required: true },
    variancePercentage: { type: Number, required: true },
    unit: { type: String, required: true },
    reason: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PhysicalStockCheckSchema.index({ restaurantId: 1, createdAt: -1 });
PhysicalStockCheckSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });

export const PhysicalStockCheck = mongoose.model<IPhysicalStockCheck>('PhysicalStockCheck', PhysicalStockCheckSchema);
