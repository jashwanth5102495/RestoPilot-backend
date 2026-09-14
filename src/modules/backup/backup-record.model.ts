import mongoose, { Document, Schema, Types } from 'mongoose';

export enum BackupType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  MANUAL = 'MANUAL'
}

export enum BackupStatus {
  GENERATED = 'GENERATED',
  VERIFIED = 'VERIFIED',
  ARCHIVED = 'ARCHIVED',
  FAILED = 'FAILED'
}

export interface IBackupRecord extends Document {
  backupId: string;
  restaurantId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  backupType: BackupType;
  backupVersion: number;
  fileSize: number;
  orderCount: number;
  billCount: number;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
  checksum: string;
  status: BackupStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BackupRecordSchema = new Schema<IBackupRecord>(
  {
    backupId: { type: String, required: true, unique: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    backupType: { type: String, enum: Object.values(BackupType), default: BackupType.WEEKLY },
    backupVersion: { type: Number, default: 1 },
    fileSize: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    billCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    checksum: { type: String, required: true },
    status: { type: String, enum: Object.values(BackupStatus), default: BackupStatus.GENERATED },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BackupRecordSchema.index({ restaurantId: 1, periodStart: 1, periodEnd: 1 });
BackupRecordSchema.index({ restaurantId: 1, checksum: 1 });

export const BackupRecord = mongoose.model<IBackupRecord>('BackupRecord', BackupRecordSchema);
