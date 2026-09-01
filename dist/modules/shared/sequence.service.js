"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceService = void 0;
exports.runWithTransaction = runWithTransaction;
const mongoose_1 = __importDefault(require("mongoose"));
const counter_model_1 = require("./counter.model");
class SequenceService {
    /**
     * Atomically generates the next sequence number for a given restaurant and sequence type.
     * e.g. nextSequence('rest123', 'ORDER') -> 1
     */
    static async getNextSequence(restaurantId, sequenceType, session) {
        const counter = await counter_model_1.Counter.findOneAndUpdate({ restaurantId, sequenceType }, { $inc: { currentValue: 1 } }, { new: true, upsert: true, session });
        return counter.currentValue;
    }
    static async getNextOrderNumber(restaurantId, session) {
        const seq = await this.getNextSequence(restaurantId, 'ORDER', session);
        return `RP-${seq.toString().padStart(6, '0')}`;
    }
    static async getNextBillNumber(restaurantId, session) {
        const seq = await this.getNextSequence(restaurantId, 'BILL', session);
        const year = new Date().getFullYear();
        return `INV-${year}-${seq.toString().padStart(6, '0')}`;
    }
    static async getNextPurchaseNumber(restaurantId, session) {
        const seq = await this.getNextSequence(restaurantId, 'PURCHASE', session);
        return `PO-${seq.toString().padStart(6, '0')}`;
    }
}
exports.SequenceService = SequenceService;
let isReplicaSetSupported = null;
async function isReplicaSet() {
    if (isReplicaSetSupported !== null)
        return isReplicaSetSupported;
    try {
        const adminDb = mongoose_1.default.connection.db?.admin();
        if (!adminDb) {
            isReplicaSetSupported = false;
            return false;
        }
        const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
        isReplicaSetSupported = Boolean(status && status.ok === 1);
    }
    catch {
        isReplicaSetSupported = false;
    }
    return isReplicaSetSupported;
}
async function runWithTransaction(fn) {
    const supportsReplica = await isReplicaSet();
    let session;
    if (supportsReplica) {
        try {
            session = await mongoose_1.default.startSession();
            session.startTransaction();
        }
        catch {
            session = undefined;
        }
    }
    try {
        const result = await fn(session);
        if (session) {
            await session.commitTransaction();
        }
        return result;
    }
    catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            }
            catch (e) { }
        }
        throw error;
    }
    finally {
        if (session) {
            try {
                session.endSession();
            }
            catch (e) { }
        }
    }
}
