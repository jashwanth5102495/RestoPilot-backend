"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
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
}
exports.InventoryService = InventoryService;
