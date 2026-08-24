import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TableStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED'
}

export interface ITable extends Document {
  restaurantId: Types.ObjectId;
  tableNumber: number;
  name?: string;
  capacity?: number;
  isActive: boolean;
  status: TableStatus; // Derived from active orders, but can be synced here
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableNumber: { type: Number, required: true },
    name: { type: String },
    capacity: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: Object.values(TableStatus), default: TableStatus.FREE },
  },
  { timestamps: true }
);

TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
TableSchema.index({ restaurantId: 1, isActive: 1 });

export const Table = mongoose.model<ITable>('Table', TableSchema);
