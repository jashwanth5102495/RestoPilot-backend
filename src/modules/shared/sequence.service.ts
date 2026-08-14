import mongoose, { ClientSession, Types } from 'mongoose';
import { Counter } from './counter.model';

export class SequenceService {
  /**
   * Atomically generates the next sequence number for a given restaurant and sequence type.
   * e.g. nextSequence('rest123', 'ORDER') -> 1
   */
  static async getNextSequence(
    restaurantId: string | Types.ObjectId,
    sequenceType: string,
    session?: ClientSession
  ): Promise<number> {
    const counter = await Counter.findOneAndUpdate(
      { restaurantId, sequenceType },
      { $inc: { currentValue: 1 } },
      { new: true, upsert: true, session }
    );
    return counter.currentValue;
  }

  static async getNextOrderNumber(restaurantId: string | Types.ObjectId, session?: ClientSession): Promise<string> {
    const seq = await this.getNextSequence(restaurantId, 'ORDER', session);
    return `RP-${seq.toString().padStart(6, '0')}`;
  }

  static async getNextBillNumber(restaurantId: string | Types.ObjectId, session?: ClientSession): Promise<string> {
    const seq = await this.getNextSequence(restaurantId, 'BILL', session);
    const year = new Date().getFullYear();
    return `INV-${year}-${seq.toString().padStart(6, '0')}`;
  }

  static async getNextPurchaseNumber(restaurantId: string | Types.ObjectId, session?: ClientSession): Promise<string> {
    const seq = await this.getNextSequence(restaurantId, 'PURCHASE', session);
    return `PO-${seq.toString().padStart(6, '0')}`;
  }
}
