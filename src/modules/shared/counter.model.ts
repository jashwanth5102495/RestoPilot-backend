import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICounter extends Document {
  restaurantId: Types.ObjectId;
  sequenceType: string;
  currentValue: number;
}

const CounterSchema = new Schema<ICounter>({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  sequenceType: { type: String, required: true },
  currentValue: { type: Number, default: 0 },
});

CounterSchema.index({ restaurantId: 1, sequenceType: 1 }, { unique: true });

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
