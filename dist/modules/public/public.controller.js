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
exports.PublicController = void 0;
const restaurant_model_1 = require("../restaurants/restaurant.model");
const dish_model_1 = require("../dishes/dish.model");
const order_model_1 = require("../orders/order.model");
const category_model_1 = require("../categories/category.model");
class PublicController {
    static async getRestaurantMenu(req, res, next) {
        try {
            const { slug } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ onlineSlug: slug, isOnlineOrderingEnabled: true }).lean();
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found or online ordering is disabled' });
            }
            const categories = await category_model_1.Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
            const dishes = await dish_model_1.Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false }).lean();
            res.status(200).json({
                success: true,
                data: {
                    restaurant: { name: restaurant.name, logo: restaurant.logo, currency: restaurant.currency },
                    categories,
                    dishes
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async placeOrder(req, res, next) {
        try {
            const { slug } = req.params;
            const { items, customerInfo } = req.body;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ onlineSlug: slug, isOnlineOrderingEnabled: true });
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }
            if (!items || !items.length || !customerInfo || !customerInfo.name || !customerInfo.phone) {
                return res.status(400).json({ success: false, message: 'Invalid order data' });
            }
            let subtotal = 0;
            let tax = 0;
            const orderItems = [];
            for (const item of items) {
                const dish = await dish_model_1.Dish.findOne({ _id: item.dishId, restaurantId: restaurant._id });
                if (!dish || !dish.isAvailable) {
                    return res.status(400).json({ success: false, message: `Dish unavailable` });
                }
                const lineTotal = dish.price * item.quantity;
                subtotal += lineTotal;
                tax += lineTotal * ((dish.taxRate || 0) / 100);
                orderItems.push({
                    dishId: dish._id,
                    dishName: dish.name,
                    quantity: item.quantity,
                    unitPrice: dish.price,
                    taxRate: dish.taxRate || 0,
                    lineTotal
                });
            }
            const total = subtotal + tax;
            const orderNumber = `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
            const newOrder = new order_model_1.Order({
                restaurantId: restaurant._id,
                orderNumber,
                items: orderItems,
                subtotal,
                discount: 0,
                tax,
                total,
                orderSource: order_model_1.OrderSource.ONLINE,
                orderStatus: order_model_1.OrderStatus.PLACED,
                paymentStatus: order_model_1.PaymentStatus.PENDING,
                customerInfo
            });
            await newOrder.save();
            res.status(201).json({
                success: true,
                data: newOrder
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleOnlineOrdering(req, res, next) {
        try {
            const reqAny = req;
            const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
            const { enabled } = req.body;
            if (!restaurantId) {
                return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
            }
            const restaurant = await restaurant_model_1.Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }
            restaurant.isOnlineOrderingEnabled = enabled;
            if (enabled && !restaurant.onlineSlug) {
                restaurant.onlineSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
            }
            await restaurant.save();
            res.status(200).json({
                success: true,
                data: restaurant
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleWaiterOrdering(req, res, next) {
        try {
            const reqAny = req;
            const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
            const { enabled } = req.body;
            if (!restaurantId) {
                return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
            }
            const restaurant = await restaurant_model_1.Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }
            restaurant.isWaiterOrderingEnabled = enabled;
            if (enabled && !restaurant.waiterSlug) {
                restaurant.waiterSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-waiter-' + Math.floor(Math.random() * 1000);
            }
            await restaurant.save();
            res.status(200).json({
                success: true,
                data: restaurant
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleBillingOrdering(req, res, next) {
        try {
            const reqAny = req;
            const restaurantId = reqAny.user?.restaurantId || reqAny.tenantId;
            const { enabled } = req.body;
            if (!restaurantId) {
                return res.status(400).json({ success: false, message: 'Restaurant context is missing' });
            }
            const restaurant = await restaurant_model_1.Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }
            restaurant.isBillingEnabled = enabled;
            if (enabled && !restaurant.billingSlug) {
                restaurant.billingSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-billing-' + Math.floor(Math.random() * 1000);
            }
            await restaurant.save();
            res.status(200).json({
                success: true,
                data: restaurant
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getWaiterTables(req, res, next) {
        try {
            const { slug } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true }).lean();
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
            }
            const { Table } = await Promise.resolve().then(() => __importStar(require('../tables/table.model')));
            const tables = await Table.find({ restaurantId: restaurant._id, isActive: true }).sort({ tableNumber: 1 }).lean();
            res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name }, tables } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getWaiterMenu(req, res, next) {
        try {
            const { slug } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true }).lean();
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
            }
            const categories = await category_model_1.Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
            const dishes = await dish_model_1.Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false })
                .populate('categoryId')
                .lean();
            res.status(200).json({ success: true, data: { categories, dishes } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getWaiterTableOrder(req, res, next) {
        try {
            const { slug, tableId } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
            }
            const order = await order_model_1.Order.findOne({
                restaurantId: restaurant._id,
                tableId: tableId,
                orderStatus: { $nin: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] }
            });
            res.status(200).json({ success: true, data: order || null });
        }
        catch (error) {
            next(error);
        }
    }
    static async placeWaiterTableOrder(req, res, next) {
        try {
            const { slug, tableId } = req.params;
            const { items } = req.body;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
            }
            const { OrderService } = await Promise.resolve().then(() => __importStar(require('../orders/order.service')));
            // Check if table has active order, if not start one
            let order = await order_model_1.Order.findOne({
                restaurantId: restaurant._id,
                tableId: tableId,
                orderStatus: { $nin: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] }
            });
            if (!order) {
                order = await OrderService.startTableOrder(restaurant._id.toString(), tableId, null); // no user id since public waiter
            }
            // Update items
            if (items && items.length > 0) {
                order = await OrderService.updateOrderItems(restaurant._id.toString(), order._id.toString(), items, null);
            }
            // Send to kitchen
            order = await OrderService.sendOrder(restaurant._id.toString(), order._id.toString(), null);
            res.status(200).json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    static async generateWaiterBill(req, res, next) {
        try {
            const { slug, tableId } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ waiterSlug: slug, isWaiterOrderingEnabled: true });
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Waiter portal not found or disabled' });
            }
            const order = await order_model_1.Order.findOne({
                restaurantId: restaurant._id,
                tableId: tableId,
                orderStatus: { $nin: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] }
            });
            if (!order) {
                return res.status(404).json({ success: false, message: 'No active order found for this table' });
            }
            const { OrderService } = await Promise.resolve().then(() => __importStar(require('../orders/order.service')));
            const updatedOrder = await OrderService.updateOrderStatus(restaurant._id.toString(), order._id.toString(), order_model_1.OrderStatus.COMPLETED, null);
            res.status(200).json({ success: true, data: updatedOrder });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBillingMenu(req, res, next) {
        try {
            const { slug } = req.params;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ billingSlug: slug, isBillingEnabled: true }).lean();
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
            }
            const categories = await category_model_1.Category.find({ restaurantId: restaurant._id, isActive: true }).lean();
            const dishes = await dish_model_1.Dish.find({ restaurantId: restaurant._id, isAvailable: true, isDeleted: false })
                .populate('categoryId')
                .lean();
            res.status(200).json({ success: true, data: { restaurant: { name: restaurant.name, logo: restaurant.logo, currency: restaurant.currency }, categories, dishes } });
        }
        catch (error) {
            next(error);
        }
    }
    static async processBillingSale(req, res, next) {
        try {
            const { slug } = req.params;
            const { items, paymentMethod, customerId } = req.body;
            const restaurant = await restaurant_model_1.Restaurant.findOne({ billingSlug: slug, isBillingEnabled: true });
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Billing portal not found or disabled' });
            }
            const { BillingService } = await Promise.resolve().then(() => __importStar(require('../billing/billing.service')));
            // Pass restaurant._id and restaurant.ownerId (or string) as userId
            const userId = restaurant.ownerId || restaurant._id;
            const result = await BillingService.processSale(restaurant._id, userId, items, paymentMethod, customerId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PublicController = PublicController;
