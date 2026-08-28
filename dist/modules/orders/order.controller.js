"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_model_1 = require("./order.model");
const order_service_1 = require("./order.service");
class OrderController {
    static async getOrders(req, res, next) {
        try {
            const { source, limit, status, since } = req.query;
            const query = { restaurantId: req.tenantId };
            if (source)
                query.orderSource = source;
            if (status)
                query.orderStatus = status;
            if (since)
                query.createdAt = { $gt: new Date(since) };
            let q = order_model_1.Order.find(query).populate('tableId', 'name').sort({ createdAt: -1 });
            if (limit)
                q = q.limit(parseInt(limit, 10));
            const orders = await q.lean();
            res.status(200).json({
                success: true,
                data: orders
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async startTableOrder(req, res, next) {
        try {
            const { tableId } = req.body;
            const order = await order_service_1.OrderService.startTableOrder(req.tenantId, tableId, req.user.userId);
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateOrderItems(req, res, next) {
        try {
            const { orderId } = req.params;
            const { updates } = req.body;
            const order = await order_service_1.OrderService.updateOrderItems(req.tenantId, orderId, updates, req.user.userId);
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    static async sendOrder(req, res, next) {
        try {
            const { orderId } = req.params;
            const order = await order_service_1.OrderService.sendOrder(req.tenantId, orderId, req.user.userId);
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateOrderStatus(req, res, next) {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            const order = await order_service_1.OrderService.updateOrderStatus(req.tenantId, orderId, status, req.user.userId);
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrderController = OrderController;
