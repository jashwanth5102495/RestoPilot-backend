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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const restaurant_model_1 = require("../restaurants/restaurant.model");
const order_model_1 = require("../orders/order.model");
const ingredient_model_1 = require("../ingredients/ingredient.model");
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
                    let onlineOrdersCount = 0;
                    let posOrdersCount = 0;
                    const rawOrders = await order_model_1.Order.find({
                        restaurantId: restaurant._id,
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        paymentStatus: order_model_1.PaymentStatus.PAID,
                        orderStatus: { $ne: order_model_1.OrderStatus.CANCELLED }
                    });
                    rawOrders.forEach(order => {
                        if (order.orderSource === 'ONLINE')
                            onlineOrdersCount++;
                        else
                            posOrdersCount++;
                    });
                    const ingredients = await ingredient_model_1.Ingredient.find({ restaurantId: restaurant._id });
                    const inventoryData = ingredients.map(ing => ({
                        name: ing.name,
                        quantity: ing.currentStock,
                        unit: ing.unit
                    }));
                    try {
                        const { PdfService } = await Promise.resolve().then(() => __importStar(require('./pdf.service')));
                        const path = await Promise.resolve().then(() => __importStar(require('path')));
                        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                        const { MessageMedia } = await Promise.resolve().then(() => __importStar(require('whatsapp-web.js')));
                        const reportData = {
                            restaurantName: restaurant.name,
                            date: now.toLocaleDateString(),
                            sales: {
                                total: totalSales,
                                cash: cash,
                                card: card,
                                upi: upi,
                                onlineOrders: onlineOrdersCount,
                                posOrders: posOrdersCount
                            },
                            inventory: inventoryData
                        };
                        const tempDir = path.resolve(process.cwd(), 'temp');
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir);
                        }
                        const pdfPath = path.join(tempDir, `report-${restaurant._id}-${Date.now()}.pdf`);
                        await PdfService.generateDailyReport(reportData, pdfPath);
                        const media = MessageMedia.fromFilePath(pdfPath);
                        const message = `*Daily Sales & Inventory Report*\nRestaurant: ${restaurant.name}\nDate: ${now.toLocaleDateString()}\n\nPlease find your detailed report attached.`;
                        // Note: whatsappService.sendMessage might need to support sending media. 
                        // In whatsapp.service.ts, sendMessage uses client.sendMessage(chatId, text). We can pass media instead of text if it supports it, 
                        // or we need to update whatsappService.sendMessage to accept media. 
                        // I will update whatsapp.service.ts next.
                        await whatsapp_service_1.default.sendMessage(restaurant.notificationSettings.whatsappNumber, message, media);
                        console.log(`Sent daily report PDF to restaurant ${restaurant._id} on WhatsApp: ${restaurant.notificationSettings.whatsappNumber}`);
                        // Clean up PDF
                        fs.unlinkSync(pdfPath);
                    }
                    catch (err) {
                        console.error(`Failed to generate/send daily report PDF to ${restaurant._id}:`, err);
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
