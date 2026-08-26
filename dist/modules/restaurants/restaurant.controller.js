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
exports.RestaurantController = void 0;
const restaurant_service_1 = require("./restaurant.service");
const agent_model_1 = require("../admin/agent.model");
class RestaurantController {
    static async getBranches(req, res, next) {
        try {
            const branches = await restaurant_service_1.RestaurantService.getBranches(req.tenantId);
            res.status(200).json({ success: true, data: branches });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchDashboard(req, res, next) {
        try {
            const timeframe = req.query.timeframe || 'today';
            const dashboard = await restaurant_service_1.RestaurantService.getBranchDashboard(req.tenantId, req.params.branchId, timeframe);
            res.status(200).json({ success: true, data: dashboard });
        }
        catch (error) {
            next(error);
        }
    }
    static async createBranch(req, res, next) {
        try {
            const newBranch = await restaurant_service_1.RestaurantService.createBranch(req.tenantId, req.body);
            res.status(201).json({ success: true, data: newBranch });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyAgent(req, res, next) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Agent code is required' });
            }
            const agent = await agent_model_1.Agent.findOne({ code: code.toUpperCase().trim(), status: 'ACTIVE' });
            if (!agent) {
                return res.status(400).json({ success: false, message: 'Invalid or inactive agent code' });
            }
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    agentName: agent.name
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateRestaurant(req, res, next) {
        try {
            const { id } = req.params;
            const { name, phone, email, address, city, state, pincode, gstNumber, notificationSettings } = req.body;
            const { Restaurant } = await Promise.resolve().then(() => __importStar(require('./restaurant.model')));
            const currentRes = await Restaurant.findById(req.tenantId);
            if (!currentRes)
                return res.status(404).json({ success: false, message: 'Active restaurant context not found' });
            const rootId = currentRes.parentRestaurantId || currentRes._id;
            const targetRes = await Restaurant.findById(id);
            if (!targetRes)
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            const isAuthorized = targetRes._id.toString() === rootId.toString() ||
                (targetRes.parentRestaurantId && targetRes.parentRestaurantId.toString() === rootId.toString());
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Unauthorized to modify this restaurant profile' });
            }
            targetRes.name = name || targetRes.name;
            targetRes.phone = phone || targetRes.phone;
            targetRes.email = email || targetRes.email;
            targetRes.address = address || targetRes.address;
            targetRes.city = city || targetRes.city;
            targetRes.state = state || targetRes.state;
            targetRes.pincode = pincode || targetRes.pincode;
            targetRes.gstNumber = gstNumber || targetRes.gstNumber;
            if (notificationSettings) {
                targetRes.notificationSettings = {
                    ...targetRes.notificationSettings,
                    ...notificationSettings
                };
            }
            await targetRes.save();
            res.status(200).json({ success: true, data: targetRes });
        }
        catch (error) {
            next(error);
        }
    }
    static async testWhatsappReport(req, res, next) {
        try {
            const { Restaurant } = await Promise.resolve().then(() => __importStar(require('./restaurant.model')));
            const { Order, PaymentStatus, OrderStatus } = await Promise.resolve().then(() => __importStar(require('../orders/order.model')));
            const { Ingredient } = await Promise.resolve().then(() => __importStar(require('../ingredients/ingredient.model')));
            const whatsappService = (await Promise.resolve().then(() => __importStar(require('../notifications/whatsapp.service')))).default;
            const { PdfService } = await Promise.resolve().then(() => __importStar(require('../notifications/pdf.service')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const { MessageMedia } = await Promise.resolve().then(() => __importStar(require('whatsapp-web.js')));
            const { id } = req.params;
            const currentRes = await Restaurant.findById(id);
            if (!currentRes)
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            if (!currentRes.notificationSettings?.whatsappNumber) {
                return res.status(400).json({ success: false, message: 'No WhatsApp number configured.' });
            }
            const now = new Date();
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            const salesAggregate = await Order.aggregate([
                {
                    $match: {
                        restaurantId: currentRes._id,
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        paymentStatus: PaymentStatus.PAID,
                        orderStatus: { $ne: OrderStatus.CANCELLED }
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
            const rawOrders = await Order.find({
                restaurantId: currentRes._id,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                paymentStatus: PaymentStatus.PAID,
                orderStatus: { $ne: OrderStatus.CANCELLED }
            });
            rawOrders.forEach(order => {
                if (order.orderSource === 'ONLINE')
                    onlineOrdersCount++;
                else
                    posOrdersCount++;
            });
            const ingredients = await Ingredient.find({ restaurantId: currentRes._id });
            const inventoryData = ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.currentStock,
                unit: ing.unit
            }));
            const reportData = {
                restaurantName: currentRes.name,
                date: now.toLocaleDateString(),
                sales: {
                    total: totalSales,
                    cash,
                    card,
                    upi,
                    onlineOrders: onlineOrdersCount,
                    posOrders: posOrdersCount
                },
                inventory: inventoryData
            };
            const tempDir = path.resolve(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            const pdfPath = path.join(tempDir, `test-report-${currentRes._id}-${Date.now()}.pdf`);
            await PdfService.generateDailyReport(reportData, pdfPath);
            const media = MessageMedia.fromFilePath(pdfPath);
            const message = `*Daily Sales & Inventory Report (TEST)*\nRestaurant: ${currentRes.name}\nDate: ${now.toLocaleDateString()}\n\nPlease find your detailed test report attached.`;
            await whatsappService.sendMessage(currentRes.notificationSettings.whatsappNumber, message, media);
            fs.unlinkSync(pdfPath);
            res.status(200).json({ success: true, message: 'Test report sent successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RestaurantController = RestaurantController;
