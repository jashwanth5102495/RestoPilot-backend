import mongoose, { Document, Schema, Types } from 'mongoose';

export enum AuditAction {
  BACKUP_GENERATED = 'BACKUP_GENERATED',
  BACKUP_DOWNLOADED = 'BACKUP_DOWNLOADED',
  BACKUP_VALIDATED = 'BACKUP_VALIDATED',
  MONTHLY_ARCHIVED = 'MONTHLY_ARCHIVED',
  DATA_DELETED = 'DATA_DELETED',
  HISTORICAL_UPLOADED = 'HISTORICAL_UPLOADED',
  HISTORICAL_IMPORTED = 'HISTORICAL_IMPORTED',
  ARCHIVE_FAILED = 'ARCHIVE_FAILED'
}

export interface IAuditLog extends Document {
  action: AuditAction;
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  details: string;
  checksum?: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: Object.values(AuditAction), required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, required: true },
    checksum: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AuditLogSchema.index({ restaurantId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
