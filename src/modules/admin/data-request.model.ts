import mongoose, { Document, Schema, Types } from 'mongoose';

export enum DataRequestStatus {
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED'
}

export interface IDataRequest extends Document {
  restaurantId: Types.ObjectId;
  month: string; // e.g., '08'
  year: string; // e.g., '2026'
  status: DataRequestStatus;
  dataUrl?: string; // S3 link or local file path
  createdAt: Date;
  updatedAt: Date;
}

const DataRequestSchema = new Schema<IDataRequest>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    month: { type: String, required: true },
    year: { type: String, required: true },
    status: { type: String, enum: Object.values(DataRequestStatus), default: DataRequestStatus.PENDING },
    dataUrl: { type: String },
  },
  { timestamps: true }
);

export const DataRequest = mongoose.model<IDataRequest>('DataRequest', DataRequestSchema);
