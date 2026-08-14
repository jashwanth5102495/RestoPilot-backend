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
exports.Bill = exports.BillStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const order_model_1 = require("../orders/order.model");
var BillStatus;
(function (BillStatus) {
    BillStatus["ACTIVE"] = "ACTIVE";
    BillStatus["VOID"] = "VOID";
    BillStatus["REFUNDED"] = "REFUNDED";
})(BillStatus || (exports.BillStatus = BillStatus = {}));
const BillItemSchema = new mongoose_1.Schema({
    dishId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Dish', required: true },
    dishName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
}, { _id: false });
const BillSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    billNumber: { type: String, required: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', required: true },
    items: [BillItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: Object.values(order_model_1.PaymentMethod), required: true },
    paymentStatus: { type: String, enum: Object.values(order_model_1.PaymentStatus), default: order_model_1.PaymentStatus.PAID },
    status: { type: String, enum: Object.values(BillStatus), default: BillStatus.ACTIVE },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
BillSchema.index({ restaurantId: 1, billNumber: 1 }, { unique: true });
BillSchema.index({ restaurantId: 1, issuedAt: -1 });
BillSchema.index({ orderId: 1 });
exports.Bill = mongoose_1.default.model('Bill', BillSchema);
