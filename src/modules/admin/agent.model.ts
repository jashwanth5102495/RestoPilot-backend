import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);
