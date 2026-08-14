"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const restaurant_model_1 = require("../restaurants/restaurant.model");
const order_model_1 = require("../orders/order.model");
const ingredient_model_1 = require("../ingredients/ingredient.model");
const data_request_model_1 = require("./data-request.model");
class AdminController {
    static async getRestaurants(req, res, next) {
        try {
            const restaurants = await restaurant_model_1.Restaurant.find().populate('ownerId', 'name email phone').lean();
            const statsPromises = restaurants.map(async (r) => {
                const totalOrders = await order_model_1.Order.countDocuments({ restaurantId: r._id });
                const orders = await order_model_1.Order.find({ restaurantId: r._id });
                const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
                const inventoryItems = await ingredient_model_1.Ingredient.countDocuments({ restaurantId: r._id });
                return {
                    ...r,
                    stats: {
                        totalOrders,
                        totalSales,
                        inventoryItems
                    }
                };
            });
            const restaurantsWithStats = await Promise.all(statsPromises);
            res.status(200).json({
                success: true,
                data: restaurantsWithStats
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async exportBackup(req, res, next) {
        try {
            const { month, year } = req.query;
            if (!month || !year)
                return res.status(400).json({ success: false, message: 'Month and year required' });
            const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            const orders = await order_model_1.Order.find({
                createdAt: { $gte: startDate, $lt: endDate }
            }).lean();
            res.setHeader('Content-disposition', `attachment; filename=backup-${month}-${year}.json`);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify(orders, null, 2));
        }
        catch (error) {
            next(error);
        }
    }
    static async wipeBackup(req, res, next) {
        try {
            const { month, year } = req.query;
            if (!month || !year)
                return res.status(400).json({ success: false, message: 'Month and year required' });
            const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            const result = await order_model_1.Order.deleteMany({
                createdAt: { $gte: startDate, $lt: endDate }
            });
            res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} orders.` });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDataRequests(req, res, next) {
        try {
            const requests = await data_request_model_1.DataRequest.find().populate('restaurantId', 'name email').sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: requests });
        }
        catch (error) {
            next(error);
        }
    }
    static async fulfillDataRequest(req, res, next) {
        try {
            const { id } = req.params;
            const { dataUrl } = req.body;
            const request = await data_request_model_1.DataRequest.findById(id);
            if (!request)
                return res.status(404).json({ success: false, message: 'Request not found' });
            request.status = data_request_model_1.DataRequestStatus.FULFILLED;
            request.dataUrl = dataUrl;
            await request.save();
            res.status(200).json({ success: true, data: request });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
