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
exports.BillingService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const order_model_1 = require("../orders/order.model");
const bill_model_1 = require("./bill.model");
const dish_model_1 = require("../dishes/dish.model");
const sequence_service_1 = require("../shared/sequence.service");
const order_consumption_service_1 = require("../orders/order-consumption.service");
const inventory_service_1 = require("../inventory/inventory.service");
const inventory_transaction_model_1 = require("../inventory/inventory-transaction.model");
const AppError_1 = require("../../shared/errors/AppError");
class BillingService {
    /**
     * Completes a sale: Creates Order, Deducts Inventory, Creates Bill atomically.
     */
    static async processSale(restaurantId, userId, items, paymentMethod, customerId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Validate dishes and calculate totals server-side
            const dishIds = items.map(i => i.dishId);
            const dishes = await dish_model_1.Dish.find({ _id: { $in: dishIds }, restaurantId, isDeleted: false }).session(session);
            const dishMap = new Map(dishes.map(d => [d._id.toString(), d]));
            let subtotal = 0;
            let tax = 0;
            const orderItems = [];
            for (const item of items) {
                const dish = dishMap.get(item.dishId);
                if (!dish || !dish.isAvailable) {
                    throw new AppError_1.AppError(`Dish ${item.dishId} is unavailable or invalid`, 400);
                }
                const lineTotal = dish.price * item.quantity;
                const lineTax = (lineTotal * dish.taxRate) / 100;
                subtotal += lineTotal;
                tax += lineTax;
                orderItems.push({
                    dishId: dish._id,
                    dishName: dish.name,
                    quantity: item.quantity,
                    unitPrice: dish.price,
                    taxRate: dish.taxRate,
                    lineTotal
                });
            }
            const total = subtotal + tax; // Add discount logic later if needed
            // 2. Create Order
            const orderNumber = await sequence_service_1.SequenceService.getNextOrderNumber(restaurantId, session);
            const order = new order_model_1.Order({
                restaurantId,
                orderNumber,
                customerId,
                items: orderItems,
                subtotal,
                discount: 0,
                tax,
                total,
                paymentMethod,
                paymentStatus: order_model_1.PaymentStatus.PAID,
                orderStatus: order_model_1.OrderStatus.COMPLETED,
                createdBy: userId
            });
            await order.save({ session });
            // 3. Inventory Deduction
            const requiredIngredients = await order_consumption_service_1.OrderConsumptionService.calculateOrderConsumption(restaurantId, orderItems);
            for (const reqIng of requiredIngredients) {
                // deductStock atomically ensures we don't go negative if not allowed
                await inventory_service_1.InventoryService.adjustStock(restaurantId, reqIng.ingredientId, -reqIng.quantityInBaseUnit, 'BASE_UNIT', 
                // We passed `quantityInBaseUnit`, so we can pass any base unit, e.g. the ingredient's actual base unit.
                // We need a slight modification to `adjustStock` to accept base quantities safely.
                inventory_transaction_model_1.TransactionType.SALE_CONSUMPTION, session, { referenceType: 'ORDER', referenceId: order._id, createdBy: new mongoose_1.Types.ObjectId(userId) }, false // Prevent negative stock
                );
            }
            // 4. Create Bill
            const billNumber = await sequence_service_1.SequenceService.getNextBillNumber(restaurantId, session);
            const bill = new bill_model_1.Bill({
                restaurantId,
                billNumber,
                orderId: order._id,
                items: orderItems,
                subtotal,
                discount: 0,
                tax,
                total,
                paymentMethod,
                paymentStatus: order_model_1.PaymentStatus.PAID,
                status: bill_model_1.BillStatus.ACTIVE,
                issuedBy: userId
            });
            await bill.save({ session });
            await session.commitTransaction();
            return { order, bill };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async voidBill(restaurantId, billId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const bill = await bill_model_1.Bill.findOne({ _id: billId, restaurantId, status: bill_model_1.BillStatus.ACTIVE }).session(session);
            if (!bill)
                throw new AppError_1.AppError('Active bill not found', 404);
            const order = await order_model_1.Order.findOne({ _id: bill.orderId, restaurantId }).session(session);
            if (!order)
                throw new AppError_1.AppError('Order not found', 404);
            // 1. Mark bill and order as cancelled
            bill.status = bill_model_1.BillStatus.VOID;
            await bill.save({ session });
            order.orderStatus = order_model_1.OrderStatus.CANCELLED;
            order.paymentStatus = order_model_1.PaymentStatus.REFUNDED;
            await order.save({ session });
            // 2. Restore inventory
            const consumedIngredients = await order_consumption_service_1.OrderConsumptionService.calculateOrderConsumption(restaurantId, bill.items);
            for (const reqIng of consumedIngredients) {
                await inventory_service_1.InventoryService.adjustStock(restaurantId, reqIng.ingredientId, reqIng.quantityInBaseUnit, 'BASE_UNIT', inventory_transaction_model_1.TransactionType.REVERSAL, session, { referenceType: 'BILL_VOID', referenceId: bill._id, createdBy: new mongoose_1.Types.ObjectId(userId), notes: `Voided bill ${bill.billNumber}` }, true // It's restoring stock, negative stock check isn't strictly necessary
                );
            }
            await session.commitTransaction();
            return bill;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.BillingService = BillingService;
