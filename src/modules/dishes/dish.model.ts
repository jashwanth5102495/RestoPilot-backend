import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDish extends Document {
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  image?: string;
  isAvailable: boolean;
  sku?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DishSchema = new Schema<IDish>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 5, min: 0 },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
    sku: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DishSchema.index({ restaurantId: 1, categoryId: 1 });
DishSchema.index({ restaurantId: 1, isDeleted: 1, isAvailable: 1 });
DishSchema.index({ restaurantId: 1, categoryId: 1, isDeleted: 1, isAvailable: 1 });
DishSchema.index({ restaurantId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Dish = mongoose.model<IDish>('Dish', DishSchema);
