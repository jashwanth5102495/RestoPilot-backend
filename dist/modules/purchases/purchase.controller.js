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
exports.PurchaseController = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const purchase_model_1 = require("./purchase.model");
const sequence_service_1 = require("../shared/sequence.service");
const inventory_service_1 = require("../inventory/inventory.service");
const AppError_1 = require("../../shared/errors/AppError");
class PurchaseController {
    static async getPurchases(req, res, next) {
        try {
            const purchases = await purchase_model_1.Purchase.find({ restaurantId: req.tenantId })
                .populate('supplierId', 'name email phone')
                .populate('items.ingredientId', 'name unit')
                .sort({ purchaseDate: -1 })
                .lean();
            res.status(200).json({ success: true, data: purchases });
        }
        catch (error) {
            next(error);
        }
    }
    static async createPurchase(req, res, next) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { supplierId, items, paymentStatus, invoiceNumber, purchaseDate, notes } = req.body;
            const createdBy = req.user?.userId;
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new AppError_1.AppError('Purchase items are required', 400);
            }
            if (!createdBy) {
                throw new AppError_1.AppError('User session context is missing', 401);
            }
            const purchaseNumber = await sequence_service_1.SequenceService.getNextPurchaseNumber(req.tenantId, session);
            let subtotal = 0;
            const purchaseItems = [];
            for (const item of items) {
                if (!item.ingredientId || !item.quantity || !item.unitCost) {
                    throw new AppError_1.AppError('Each purchase item must have ingredientId, quantity, and unitCost', 400);
                }
                const lineTotal = item.quantity * item.unitCost;
                subtotal += lineTotal;
                purchaseItems.push({
                    ingredientId: new mongoose_1.Types.ObjectId(item.ingredientId),
                    quantity: item.quantity,
                    unit: item.unit || 'pcs',
                    unitCost: item.unitCost,
                    lineTotal
                });
            }
            const total = subtotal; // Tax or discount can be implemented later
            const purchase = new purchase_model_1.Purchase({
                restaurantId: req.tenantId,
                purchaseNumber,
                supplierId: supplierId ? new mongoose_1.Types.ObjectId(supplierId) : undefined,
                items: purchaseItems,
                subtotal,
                tax: 0,
                total,
                paymentStatus: paymentStatus || 'PENDING',
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                invoiceNumber,
                notes,
                createdBy: new mongoose_1.Types.ObjectId(createdBy)
            });
            await purchase.save({ session });
            // Deduct/Add stock atomically and adjust averageCost
            for (const item of purchaseItems) {
                await inventory_service_1.InventoryService.addPurchaseStock(req.tenantId, item.ingredientId, item.quantity, item.unitCost, purchase._id, new mongoose_1.Types.ObjectId(createdBy), session);
            }
            await session.commitTransaction();
            res.status(201).json({ success: true, data: purchase });
        }
        catch (error) {
            await session.abortTransaction();
            next(error);
        }
        finally {
            session.endSession();
        }
    }
}
exports.PurchaseController = PurchaseController;
