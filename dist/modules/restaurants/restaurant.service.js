"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantService = void 0;
const restaurant_model_1 = require("./restaurant.model");
const order_model_1 = require("../orders/order.model");
const ingredient_model_1 = require("../ingredients/ingredient.model");
const AppError_1 = require("../../shared/errors/AppError");
class RestaurantService {
    static async getBranches(restaurantId) {
        const branches = await restaurant_model_1.Restaurant.find({
            $or: [
                { _id: restaurantId },
                { parentRestaurantId: restaurantId }
            ]
        }).select('_id name city address status parentRestaurantId');
        return branches;
    }
    static async getBranchDashboard(restaurantId, branchId) {
        const isAuthorized = branchId === restaurantId ||
            (await restaurant_model_1.Restaurant.exists({ _id: branchId, parentRestaurantId: restaurantId }));
        if (!isAuthorized) {
            throw new AppError_1.ForbiddenError('You are not authorized to access this branch dashboard');
        }
        const [totalOrders, salesResult, lowStockItems, recentOrders] = await Promise.all([
            order_model_1.Order.countDocuments({ restaurantId: branchId }),
            order_model_1.Order.aggregate([
                { $match: { restaurantId: branchId } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            ingredient_model_1.Ingredient.countDocuments({
                restaurantId: branchId,
                $expr: { $lte: ['$currentStock', '$minimumStock'] }
            }),
            order_model_1.Order.find({ restaurantId: branchId })
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        return {
            totalOrders,
            totalSales,
            lowStockItems,
            recentOrders
        };
    }
}
exports.RestaurantService = RestaurantService;
