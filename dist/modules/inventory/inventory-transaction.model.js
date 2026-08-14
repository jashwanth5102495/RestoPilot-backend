"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryTransaction = exports.TransactionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var TransactionType;
(function (TransactionType) {
    TransactionType["OPENING_STOCK"] = "OPENING_STOCK";
    TransactionType["PURCHASE"] = "PURCHASE";
    TransactionType["SALE_CONSUMPTION"] = "SALE_CONSUMPTION";
    TransactionType["WASTAGE"] = "WASTAGE";
    TransactionType["ADJUSTMENT_IN"] = "ADJUSTMENT_IN";
    TransactionType["ADJUSTMENT_OUT"] = "ADJUSTMENT_OUT";
    TransactionType["RETURN"] = "RETURN";
    TransactionType["REVERSAL"] = "REVERSAL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
const InventoryTransactionSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    ingredientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    referenceType: { type: String },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    balanceAfter: { type: Number, required: true, min: 0 },
    notes: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
InventoryTransactionSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });
InventoryTransactionSchema.index({ restaurantId: 1, referenceId: 1 });
exports.InventoryTransaction = mongoose_1.default.model('InventoryTransaction', InventoryTransactionSchema);
