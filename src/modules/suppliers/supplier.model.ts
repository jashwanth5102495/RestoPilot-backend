import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISupplier extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, lowercase: true },
    address: { type: String },
    gstNumber: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SupplierSchema.index({ restaurantId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
