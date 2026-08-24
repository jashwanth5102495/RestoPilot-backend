"use strict";
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
                tax: 0,
                total: 0,
                orderStatus: order_model_1.OrderStatus.DRAFT,
                orderSource: order_model_1.OrderSource.IN_STORE,
                startedBy: userId,
                createdBy: userId,
                orderActivity: [{
                        action: 'ORDER_STARTED',
                        userId,
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
                            userId: new mongoose_1.default.Types.ObjectId(userId),
                            timestamp: new Date(),
                            details: `Removed ${dish.name}`
                        });
                    }
                    else {
                        order.items[existingItemIndex].lineTotal = order.items[existingItemIndex].quantity * order.items[existingItemIndex].unitPrice;
                        order.orderActivity.push({
                            action: 'ITEM_UPDATED',
                            userId: new mongoose_1.default.Types.ObjectId(userId),
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
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        timestamp: new Date(),
                        details: `Added ${dish.name} x${update.quantityChange}`
                    });
                }
            }
            // Recalculate totals
            order.subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
            order.tax = order.subtotal * 0.05; // 5% tax example
            order.total = order.subtotal + order.tax - order.discount;
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
            userId: new mongoose_1.default.Types.ObjectId(userId),
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
            order.orderStatus = status;
            order.orderActivity.push({
                action: `STATUS_CHANGED_TO_${status}`,
                userId: new mongoose_1.default.Types.ObjectId(userId),
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
