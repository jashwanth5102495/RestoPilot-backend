"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_service_1 = require("./billing.service");
const restaurant_model_1 = require("../restaurants/restaurant.model");
const data_request_model_1 = require("../admin/data-request.model");
class BillingController {
    static async processSale(req, res, next) {
        try {
            const { items, paymentMethod, customerId } = req.body;
            const result = await billing_service_1.BillingService.processSale(req.tenantId, req.user.userId, items, paymentMethod, customerId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async paySubscription(req, res, next) {
        try {
            const restaurantId = req.user?.restaurantId;
            if (!restaurantId)
                return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
            const restaurant = await restaurant_model_1.Restaurant.findById(restaurantId);
            if (!restaurant)
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            restaurant.subscriptionStatus = restaurant_model_1.SubscriptionStatus.ACTIVE;
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            restaurant.subscriptionExpiresAt = expiresAt;
            await restaurant.save();
            res.status(200).json({ success: true, data: { subscriptionStatus: restaurant.subscriptionStatus, subscriptionExpiresAt: restaurant.subscriptionExpiresAt } });
        }
        catch (error) {
            next(error);
        }
    }
    static async payDataRequest(req, res, next) {
        try {
            const restaurantId = req.user?.restaurantId;
            const { month, year } = req.body;
            if (!restaurantId)
                return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
            if (!month || !year)
                return res.status(400).json({ success: false, message: 'Month and year required' });
            const newRequest = new data_request_model_1.DataRequest({
                restaurantId,
                month,
                year
            });
            await newRequest.save();
            res.status(200).json({ success: true, data: newRequest });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDataRequests(req, res, next) {
        try {
            const restaurantId = req.user?.restaurantId;
            if (!restaurantId)
                return res.status(400).json({ success: false, message: 'Restaurant ID missing' });
            const requests = await data_request_model_1.DataRequest.find({ restaurantId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: requests });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BillingController = BillingController;
