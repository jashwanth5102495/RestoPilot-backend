"use strict";
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
}
exports.PublicController = PublicController;
