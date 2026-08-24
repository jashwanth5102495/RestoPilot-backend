"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const mongoose_1 = require("mongoose");
const ingredient_model_1 = require("../ingredients/ingredient.model");
const inventory_transaction_model_1 = require("./inventory-transaction.model");
const unit_converter_1 = require("../../shared/utils/unit-converter");
const AppError_1 = require("../../shared/errors/AppError");
class InventoryService {
    /**
     * Adjusts stock level and records the transaction atomically.
     */
    static async adjustStock(restaurantId, ingredientId, quantity, unit, type, session, referenceDetails, allowNegativeStock = false) {
        const ingredient = await ingredient_model_1.Ingredient.findOne({ _id: ingredientId, restaurantId }).session(session);
        if (!ingredient) {
            throw new AppError_1.AppError(`Ingredient not found: ${ingredientId}`, 404);
        }
        const baseQuantity = unit === 'BASE_UNIT' ? quantity : unit_converter_1.UnitConverter.toBaseUnit(quantity, unit);
        if (unit !== 'BASE_UNIT' && !unit_converter_1.UnitConverter.areCompatible(unit, ingredient.unit)) {
            throw new AppError_1.AppError(`Incompatible units: ${unit} cannot be applied to base unit ${ingredient.unit}`, 400);
        }
        // For outgoing transactions (Sale, Wastage), quantity passed should be negative, or we make it negative
        const isOutgoing = [inventory_transaction_model_1.TransactionType.SALE_CONSUMPTION, inventory_transaction_model_1.TransactionType.WASTAGE, inventory_transaction_model_1.TransactionType.ADJUSTMENT_OUT].includes(type);
        const adjustment = isOutgoing && baseQuantity > 0 ? -baseQuantity : baseQuantity;
        const newBalance = ingredient.currentStock + adjustment;
        if (newBalance < 0 && !allowNegativeStock) {
            throw new AppError_1.AppError(`Insufficient inventory for ${ingredient.name}. Available: ${ingredient.currentStock}${ingredient.unit}, Required: ${Math.abs(adjustment)}${ingredient.unit}`, 400, 'INSUFFICIENT_STOCK');
        }
        // Record the transaction
        await inventory_transaction_model_1.InventoryTransaction.create([{
                restaurantId,
                ingredientId,
                type,
                quantity: adjustment,
                unit: ingredient.unit, // Always store in base unit
                balanceAfter: newBalance,
                referenceType: referenceDetails?.referenceType,
                referenceId: referenceDetails?.referenceId,
                notes: referenceDetails?.notes,
                createdBy: referenceDetails?.createdBy,
            }], { session });
        // Update ingredient
        ingredient.currentStock = newBalance;
        await ingredient.save({ session });
        return ingredient;
    }
    /**
     * Recalculates average cost for purchases (weighted average)
     */
    static async addPurchaseStock(restaurantId, ingredientId, purchasedQtyBaseUnit, unitCostBaseUnit, purchaseId, createdBy, session) {
        const ingredient = await ingredient_model_1.Ingredient.findOne({ _id: ingredientId, restaurantId }).session(session);
        if (!ingredient)
            throw new AppError_1.AppError('Ingredient not found', 404);
        const oldStock = ingredient.currentStock > 0 ? ingredient.currentStock : 0;
        const oldCost = ingredient.averageCost;
        // Weighted Average Calculation
        const totalOldValue = oldStock * oldCost;
        const totalNewValue = purchasedQtyBaseUnit * unitCostBaseUnit;
        const newStock = oldStock + purchasedQtyBaseUnit;
        const newAverageCost = (totalOldValue + totalNewValue) / newStock;
        ingredient.averageCost = newAverageCost;
        // Rely on adjustStock to save the stock change and record transaction
        await ingredient.save({ session });
        return this.adjustStock(restaurantId, ingredientId, purchasedQtyBaseUnit, ingredient.unit, inventory_transaction_model_1.TransactionType.PURCHASE, session, { referenceType: 'PURCHASE', referenceId: purchaseId, createdBy });
    }
    /**
     * Submits a batch of physical stock checks
     */
    static async submitPhysicalChecks(restaurantId, userId, checks) {
        const mongoose = require('mongoose');
        const { PhysicalStockCheck } = require('./physical-stock-check.model');
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const results = [];
            for (const check of checks) {
                const ingredient = await ingredient_model_1.Ingredient.findOne({ _id: check.ingredientId, restaurantId, isDeleted: false }).session(session);
                if (!ingredient)
                    throw new AppError_1.AppError(`Ingredient ${check.ingredientId} not found`, 404);
                const estimatedQuantity = ingredient.currentStock;
                const actualQuantity = check.actualQuantity;
                const variance = actualQuantity - estimatedQuantity;
                let variancePercentage = 0;
                if (estimatedQuantity > 0) {
                    variancePercentage = (variance / estimatedQuantity) * 100;
                }
                else if (estimatedQuantity === 0 && actualQuantity > 0) {
                    variancePercentage = 100; // Arbitrary representation of a positive variance on 0 stock
                }
                const checkRecord = new PhysicalStockCheck({
                    restaurantId,
                    ingredientId: ingredient._id,
                    ingredientName: ingredient.name,
                    estimatedQuantity,
                    actualQuantity,
                    variance,
                    variancePercentage,
                    unit: ingredient.unit,
                    reason: check.reason,
                    notes: check.notes,
                    createdBy: userId,
                });
                await checkRecord.save({ session });
                // If variance is non-zero, we must adjust the stock to match actual physical count
                if (variance !== 0) {
                    await this.adjustStock(restaurantId, ingredient._id, variance, 'BASE_UNIT', inventory_transaction_model_1.TransactionType.PHYSICAL_STOCK_ADJUSTMENT, session, { referenceType: 'PHYSICAL_CHECK', referenceId: checkRecord._id, notes: check.notes, createdBy: new mongoose_1.Types.ObjectId(userId) }, true // Allow negative adjustment if actual < 0 (unlikely but safe)
                    );
                }
                // Update ingredient's last check info
                ingredient.lastCheckedAt = new Date();
                ingredient.lastVariance = variance;
                await ingredient.save({ session });
                results.push(checkRecord);
            }
            await session.commitTransaction();
            return results;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.InventoryService = InventoryService;
