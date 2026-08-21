"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const restaurant_model_1 = require("../restaurants/restaurant.model");
const order_model_1 = require("../orders/order.model");
const whatsapp_service_1 = __importDefault(require("./whatsapp.service"));
class CronService {
    start() {
        // Run every minute
        node_cron_1.default.schedule('* * * * *', async () => {
            try {
                const now = new Date();
                const currentHours = now.getHours().toString().padStart(2, '0');
                const currentMinutes = now.getMinutes().toString().padStart(2, '0');
                const currentTime = `${currentHours}:${currentMinutes}`; // HH:mm format
                // Find restaurants with enabled notifications matching the current time
                const restaurants = await restaurant_model_1.Restaurant.find({
                    'notificationSettings.enabled': true,
                    'notificationSettings.scheduledTime': currentTime,
                });
                for (const restaurant of restaurants) {
                    if (!restaurant.notificationSettings?.whatsappNumber)
                        continue;
                    // Calculate today's sales
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);
                    const salesAggregate = await order_model_1.Order.aggregate([
                        {
                            $match: {
                                restaurantId: restaurant._id,
                                createdAt: { $gte: startOfDay, $lte: endOfDay },
                                paymentStatus: order_model_1.PaymentStatus.PAID,
                                orderStatus: { $ne: order_model_1.OrderStatus.CANCELLED }
                            }
                        },
                        {
                            $group: {
                                _id: '$paymentMethod',
                                total: { $sum: '$total' }
                            }
                        }
                    ]);
                    let cash = 0;
                    let card = 0;
                    let upi = 0;
                    let totalSales = 0;
                    salesAggregate.forEach((item) => {
                        const methodTotal = item.total || 0;
                        if (item._id === 'CASH')
                            cash += methodTotal;
                        if (item._id === 'CARD')
                            card += methodTotal;
                        if (item._id === 'UPI')
                            upi += methodTotal;
                        totalSales += methodTotal;
                    });
                    const message = `*Daily Sales Report*\nRestaurant: ${restaurant.name}\nDate: ${now.toLocaleDateString()}\n\n*Sales Breakdown:*\nCash: ₹${cash}\nCard: ₹${card}\nUPI: ₹${upi}\n\n*Total Sales:* ₹${totalSales}`;
                    try {
                        await whatsapp_service_1.default.sendMessage(restaurant.notificationSettings.whatsappNumber, message);
                        console.log(`Sent daily report to restaurant ${restaurant._id} on WhatsApp: ${restaurant.notificationSettings.whatsappNumber}`);
                    }
                    catch (err) {
                        console.error(`Failed to send daily report to ${restaurant._id}:`, err);
                    }
                }
            }
            catch (error) {
                console.error('Error in cron job:', error);
            }
        });
        console.log('Cron jobs scheduled.');
    }
}
exports.default = new CronService();
