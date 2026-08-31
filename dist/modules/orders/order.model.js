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
exports.Order = exports.OrderSource = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "DRAFT";
    OrderStatus["PLACED"] = "PLACED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["OTHER"] = "OTHER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var OrderSource;
(function (OrderSource) {
    OrderSource["IN_STORE"] = "IN_STORE";
    OrderSource["ONLINE"] = "ONLINE";
})(OrderSource || (exports.OrderSource = OrderSource = {}));
const OrderItemSchema = new mongoose_1.Schema({
    dishId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Dish', required: true },
    dishName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });
const OrderActivitySchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderNumber: { type: String, required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    orderStatus: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PLACED },
    orderSource: { type: String, enum: Object.values(OrderSource), default: OrderSource.IN_STORE },
    customerInfo: {
        name: { type: String },
        phone: { type: String },
        address: { type: String }
    },
    tableId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Table' },
    inventoryConsumed: { type: Boolean, default: false },
    startedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    orderActivity: [OrderActivitySchema],
}, { timestamps: true });
OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
exports.Order = mongoose_1.default.model('Order', OrderSchema);
