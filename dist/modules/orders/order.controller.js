"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_model_1 = require("./order.model");
class OrderController {
    static async getOrders(req, res, next) {
        try {
            const orders = await order_model_1.Order.find({ restaurantId: req.tenantId })
                .sort({ createdAt: -1 })
                .lean();
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
