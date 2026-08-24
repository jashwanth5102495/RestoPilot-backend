import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIngredient extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  sku?: string;
  unit: string; // The base unit (e.g., 'g', 'ml', 'pcs')
  minimumStock: number;
  currentStock: number;
  averageCost: number; // Cost per base unit
  lastCheckedAt?: Date;
  lastVariance?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    sku: { type: String },
    unit: { type: String, required: true },
    minimumStock: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0 },
    averageCost: { type: Number, default: 0, min: 0 },
    lastCheckedAt: { type: Date },
    lastVariance: { type: Number },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

IngredientSchema.index({ restaurantId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Ingredient = mongoose.model<IIngredient>('Ingredient', IngredientSchema);
