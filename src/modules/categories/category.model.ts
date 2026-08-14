import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
