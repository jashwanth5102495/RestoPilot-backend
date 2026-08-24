"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_model_1 = require("./order.model");
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
            let q = order_model_1.Order.find(query).sort({ createdAt: -1 });
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
}
exports.OrderController = OrderController;
