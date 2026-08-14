"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceService = void 0;
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
