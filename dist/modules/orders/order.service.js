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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const order_model_1 = require("./order.model");
const table_model_1 = require("../tables/table.model");
const dish_model_1 = require("../dishes/dish.model");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("../../shared/errors/AppError");
const sequence_service_1 = require("../shared/sequence.service");
const socket_1 = require("../../shared/utils/socket");
class OrderService {
    static async startTableOrder(restaurantId, tableId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const table = await table_model_1.Table.findOne({ _id: tableId, restaurantId, isActive: true }).session(session);
            if (!table)
                throw new AppError_1.ValidationError('Table not found or inactive');
            // Check for existing active order
            const existingOrder = await order_model_1.Order.findOne({
                restaurantId,
                tableId,
                orderStatus: { $nin: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] }
            }).session(session);
            if (existingOrder) {
                throw new AppError_1.ValidationError('Table already has an active order');
            }
            const orderNumber = await sequence_service_1.SequenceService.getNextOrderNumber(restaurantId, session);
            const newOrder = new order_model_1.Order({
                restaurantId,
                tableId,
                orderNumber,
                items: [],
                subtotal: 0,
                cgst: 0,
                sgst: 0,
                tax: 0,
                total: 0,
                orderStatus: order_model_1.OrderStatus.DRAFT,
                orderSource: order_model_1.OrderSource.IN_STORE,
                startedBy: userId,
                createdBy: userId,
                orderActivity: [{
                        action: 'ORDER_STARTED',
                        userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                        timestamp: new Date()
                    }]
            });
            await newOrder.save({ session });
            table.status = table_model_1.TableStatus.OCCUPIED;
            await table.save({ session });
            await session.commitTransaction();
            (0, socket_1.emitToTenant)(restaurantId, 'order_started', { order: newOrder, tableId });
            (0, socket_1.emitToTenant)(restaurantId, 'table_status_updated', { tableId, status: table_model_1.TableStatus.OCCUPIED });
            return newOrder;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async updateOrderItems(restaurantId, orderId, updates, userId) {
        // updates: { dishId, quantityChange } (quantityChange can be positive or negative)
        // We use a transaction to safely fetch prices and update the document
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await order_model_1.Order.findOne({ _id: orderId, restaurantId }).session(session);
            if (!order)
                throw new AppError_1.ValidationError('Order not found');
            if (order.orderStatus === order_model_1.OrderStatus.COMPLETED || order.orderStatus === order_model_1.OrderStatus.CANCELLED) {
                throw new AppError_1.ValidationError('Cannot modify a completed or cancelled order');
            }
            for (const update of updates) {
                const dish = await dish_model_1.Dish.findOne({ _id: update.dishId, restaurantId }).session(session);
                if (!dish)
                    throw new AppError_1.ValidationError(`Dish ${update.dishId} not found`);
                const existingItemIndex = order.items.findIndex(item => item.dishId.toString() === update.dishId.toString());
                if (existingItemIndex > -1) {
                    order.items[existingItemIndex].quantity += update.quantityChange;
                    if (order.items[existingItemIndex].quantity <= 0) {
                        order.items.splice(existingItemIndex, 1);
                        order.orderActivity.push({
                            action: 'ITEM_REMOVED',
                            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                            timestamp: new Date(),
                            details: `Removed ${dish.name}`
                        });
                    }
                    else {
                        order.items[existingItemIndex].lineTotal = order.items[existingItemIndex].quantity * order.items[existingItemIndex].unitPrice;
                        order.orderActivity.push({
                            action: 'ITEM_UPDATED',
                            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                            timestamp: new Date(),
                            details: `Updated ${dish.name} quantity to ${order.items[existingItemIndex].quantity}`
                        });
                    }
                }
                else if (update.quantityChange > 0) {
                    const unitPrice = dish.price;
                    const taxRate = 5; // Simplified tax for now
                    order.items.push({
                        dishId: dish._id,
                        dishName: dish.name,
                        quantity: update.quantityChange,
                        unitPrice,
                        taxRate,
                        lineTotal: unitPrice * update.quantityChange,
                        addedBy: new mongoose_1.default.Types.ObjectId(userId)
                    });
                    order.orderActivity.push({
                        action: 'ITEM_ADDED',
                        userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                        timestamp: new Date(),
                        details: `Added ${dish.name} x${update.quantityChange}`
                    });
                }
            }
            // Recalculate totals
            order.subtotal = Number(order.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
            order.cgst = Number((order.subtotal * 0.025).toFixed(2));
            order.sgst = Number((order.subtotal * 0.025).toFixed(2));
            order.tax = Number((order.cgst + order.sgst).toFixed(2));
            order.total = Number((order.subtotal + order.tax - order.discount).toFixed(2));
            await order.save({ session });
            await session.commitTransaction();
            (0, socket_1.emitToTenant)(restaurantId, 'order_updated', { order });
            return order;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async sendOrder(restaurantId, orderId, userId) {
        const order = await order_model_1.Order.findOne({ _id: orderId, restaurantId });
        if (!order)
            throw new AppError_1.ValidationError('Order not found');
        if (order.items.length === 0)
            throw new AppError_1.ValidationError('Cannot send an empty order');
        order.orderStatus = order_model_1.OrderStatus.PLACED;
        order.orderActivity.push({
            action: 'ORDER_SENT',
            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            timestamp: new Date()
        });
        await order.save();
        (0, socket_1.emitToTenant)(restaurantId, 'order_sent', { order });
        return order;
    }
    static async updateOrderStatus(restaurantId, orderId, status, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await order_model_1.Order.findOne({ _id: orderId, restaurantId }).session(session);
            if (!order)
                throw new AppError_1.ValidationError('Order not found');
            if (order.orderStatus === order_model_1.OrderStatus.COMPLETED && status === order_model_1.OrderStatus.CANCELLED) {
                throw new AppError_1.ValidationError('Order has already been completed and inventory consumed. Please void the associated bill to properly reverse inventory and financials.');
            }
            order.orderStatus = status;
            order.orderActivity.push({
                action: `STATUS_CHANGED_TO_${status}`,
                userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                timestamp: new Date()
            });
            await order.save({ session });
            if (status === order_model_1.OrderStatus.COMPLETED || status === order_model_1.OrderStatus.CANCELLED) {
                if (order.tableId) {
                    const table = await table_model_1.Table.findById(order.tableId).session(session);
                    if (table) {
                        table.status = table_model_1.TableStatus.FREE;
                        await table.save({ session });
                        (0, socket_1.emitToTenant)(restaurantId, 'table_status_updated', { tableId: order.tableId, status: table_model_1.TableStatus.FREE });
                    }
                }
                // Consume inventory if completed and not already consumed
                if (status === order_model_1.OrderStatus.COMPLETED && !order.inventoryConsumed) {
                    try {
                        const { OrderConsumptionService } = await Promise.resolve().then(() => __importStar(require('./order-consumption.service')));
                        const { InventoryService } = await Promise.resolve().then(() => __importStar(require('../inventory/inventory.service')));
                        const { TransactionType } = await Promise.resolve().then(() => __importStar(require('../inventory/inventory-transaction.model')));
                        const requirements = await OrderConsumptionService.calculateOrderConsumption(restaurantId, order.items);
                        for (const req of requirements) {
                            await InventoryService.adjustStock(restaurantId, req.ingredientId, req.quantityInBaseUnit, 'BASE_UNIT', TransactionType.SALE_CONSUMPTION, session, { referenceType: 'ORDER', referenceId: order._id, createdBy: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined }, true // Allow negative stock so order completion isn't blocked
                            );
                        }
                        order.inventoryConsumed = true;
                        await order.save({ session });
                    }
                    catch (err) {
                        console.error(`Failed to consume inventory for order ${order._id}:`, err);
                        throw err; // Re-throw to abort transaction if inventory deduction fails
                    }
                }
            }
            await session.commitTransaction();
            (0, socket_1.emitToTenant)(restaurantId, 'order_status_updated', { order });
            return order;
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
exports.OrderService = OrderService;
