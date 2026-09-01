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

let isReplicaSetSupported: boolean | null = null;

async function isReplicaSet(): Promise<boolean> {
  if (isReplicaSetSupported !== null) return isReplicaSetSupported;
  try {
    const adminDb = mongoose.connection.db?.admin();
    if (!adminDb) {
      isReplicaSetSupported = false;
      return false;
    }
    const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
    isReplicaSetSupported = Boolean(status && status.ok === 1);
  } catch {
    isReplicaSetSupported = false;
  }
  return isReplicaSetSupported;
}

export async function runWithTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>
): Promise<T> {
  const supportsReplica = await isReplicaSet();
  let session: ClientSession | undefined;

  if (supportsReplica) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = undefined;
    }
  }

  try {
    const result = await fn(session);
    if (session) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (e) {}
    }
    throw error;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (e) {}
    }
  }
}
