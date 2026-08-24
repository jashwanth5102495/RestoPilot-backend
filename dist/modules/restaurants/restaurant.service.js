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
exports.RestaurantService = void 0;
const restaurant_model_1 = require("./restaurant.model");
const order_model_1 = require("../orders/order.model");
const ingredient_model_1 = require("../ingredients/ingredient.model");
const AppError_1 = require("../../shared/errors/AppError");
class RestaurantService {
    static async getBranches(restaurantId) {
        const currentRes = await restaurant_model_1.Restaurant.findById(restaurantId);
        if (!currentRes) {
            return [];
        }
        const rootId = currentRes.parentRestaurantId || currentRes._id;
        const branches = await restaurant_model_1.Restaurant.find({
            $or: [
                { _id: rootId },
                { parentRestaurantId: rootId }
            ]
        }).select('_id name city address status parentRestaurantId');
        return branches;
    }
    static async getBranchDashboard(restaurantId, branchId) {
        const currentRes = await restaurant_model_1.Restaurant.findById(restaurantId);
        if (!currentRes) {
            throw new Error('Current restaurant context not found');
        }
        const rootId = currentRes.parentRestaurantId || currentRes._id;
        let targetIds = [];
        if (branchId === 'overall') {
            const allLinkedBranches = await restaurant_model_1.Restaurant.find({
                $or: [
                    { _id: rootId },
                    { parentRestaurantId: rootId }
                ]
            }).select('_id');
            targetIds = allLinkedBranches.map(b => b._id);
        }
        else {
            const isAuthorized = branchId === restaurantId ||
                (await restaurant_model_1.Restaurant.exists({ _id: branchId, parentRestaurantId: rootId }));
            if (!isAuthorized) {
                throw new AppError_1.ForbiddenError('You are not authorized to access this branch dashboard');
            }
            targetIds = [branchId];
        }
        const [totalOrders, salesResult, lowStockItems, recentOrders, popularDishesResult] = await Promise.all([
            order_model_1.Order.countDocuments({ restaurantId: { $in: targetIds } }),
            order_model_1.Order.aggregate([
                { $match: { restaurantId: { $in: targetIds } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            ingredient_model_1.Ingredient.countDocuments({
                restaurantId: { $in: targetIds },
                $expr: { $lte: ['$currentStock', '$minimumStock'] }
            }),
            order_model_1.Order.find({ restaurantId: { $in: targetIds } })
                .sort({ createdAt: -1 })
                .limit(5),
            order_model_1.Order.aggregate([
                { $match: { restaurantId: { $in: targetIds } } },
                { $unwind: '$items' },
                { $group: {
                        _id: '$items.dishId',
                        name: { $first: '$items.dishName' },
                        orders: { $sum: '$items.quantity' },
                        revenue: { $sum: '$items.lineTotal' }
                    } },
                { $sort: { orders: -1 } },
                { $limit: 10 }
            ])
        ]);
        const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        // Format popular dishes to match frontend expectation
        const popularDishes = popularDishesResult.map(d => ({
            id: d._id,
            name: d.name,
            orders: d.orders,
            revenue: d.revenue
        }));
        const totalOnlineOrders = await order_model_1.Order.countDocuments({
            restaurantId: { $in: targetIds },
            orderSource: order_model_1.OrderSource.ONLINE
        });
        return {
            totalOrders,
            totalSales,
            lowStockItems,
            recentOrders,
            popularDishes,
            totalOnlineOrders
        };
    }
    static async createBranch(parentId, branchData) {
        const { RestaurantStatus, SubscriptionStatus } = await Promise.resolve().then(() => __importStar(require('./restaurant.model')));
        const parentRestaurant = await restaurant_model_1.Restaurant.findById(parentId);
        if (!parentRestaurant) {
            throw new Error('Parent restaurant not found');
        }
        const branch = new restaurant_model_1.Restaurant({
            name: branchData.name,
            phone: branchData.phone,
            email: branchData.email,
            address: branchData.address,
            city: branchData.city,
            state: branchData.state,
            pincode: branchData.pincode,
            restaurantType: branchData.restaurantType || parentRestaurant.restaurantType,
            parentRestaurantId: parentRestaurant._id,
            ownerId: parentRestaurant.ownerId,
            status: RestaurantStatus.ACTIVE,
            subscriptionStatus: SubscriptionStatus.ACTIVE, // Active by default for branches during testing
        });
        await branch.save();
        // Seed default categories for branch
        const defaultCategories = [
            'Starters',
            'Main Course',
            'Rice & Biryani',
            'Breads',
            'South Indian',
            'Desserts',
            'Beverages',
            'Combos & Thalis'
        ];
        const { Category } = await Promise.resolve().then(() => __importStar(require('../categories/category.model')));
        for (let i = 0; i < defaultCategories.length; i++) {
            const cat = new Category({
                restaurantId: branch._id,
                name: defaultCategories[i],
                description: `Default category: ${defaultCategories[i]}`,
                displayOrder: i + 1,
                isActive: true
            });
            await cat.save();
        }
        return branch;
    }
}
exports.RestaurantService = RestaurantService;
