import { ClientSession, Types } from 'mongoose';
import { Ingredient, IIngredient } from '../ingredients/ingredient.model';
import { InventoryTransaction, TransactionType } from './inventory-transaction.model';
import { UnitConverter } from '../../shared/utils/unit-converter';
import { AppError } from '../../shared/errors/AppError';

export class InventoryService {
  /**
   * Adjusts stock level and records the transaction atomically.
   */
  static async adjustStock(
    restaurantId: string | Types.ObjectId,
    ingredientId: string | Types.ObjectId,
    quantity: number,
    unit: string,
    type: TransactionType,
    session: ClientSession,
    referenceDetails?: { referenceType?: string; referenceId?: Types.ObjectId; notes?: string; createdBy?: Types.ObjectId },
    allowNegativeStock: boolean = false
  ): Promise<IIngredient> {
    const ingredient = await Ingredient.findOne({ _id: ingredientId, restaurantId }).session(session);
    if (!ingredient) {
      throw new AppError(`Ingredient not found: ${ingredientId}`, 404);
    }

    const baseQuantity = unit === 'BASE_UNIT' ? quantity : UnitConverter.toBaseUnit(quantity, unit);

    if (unit !== 'BASE_UNIT' && !UnitConverter.areCompatible(unit, ingredient.unit)) {
      throw new AppError(`Incompatible units: ${unit} cannot be applied to base unit ${ingredient.unit}`, 400);
    }
    
    // For outgoing transactions (Sale, Wastage), quantity passed should be negative, or we make it negative
    const isOutgoing = [TransactionType.SALE_CONSUMPTION, TransactionType.WASTAGE, TransactionType.ADJUSTMENT_OUT].includes(type);
    
    const adjustment = isOutgoing && baseQuantity > 0 ? -baseQuantity : baseQuantity;
    const newBalance = ingredient.currentStock + adjustment;

    if (newBalance < 0 && !allowNegativeStock) {
      throw new AppError(
        `Insufficient inventory for ${ingredient.name}. Available: ${ingredient.currentStock}${ingredient.unit}, Required: ${Math.abs(adjustment)}${ingredient.unit}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    // Record the transaction
    await InventoryTransaction.create([{
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
  static async addPurchaseStock(
    restaurantId: string | Types.ObjectId,
    ingredientId: string | Types.ObjectId,
    purchasedQtyBaseUnit: number,
    unitCostBaseUnit: number,
    purchaseId: Types.ObjectId,
    createdBy: Types.ObjectId,
    session: ClientSession
  ): Promise<IIngredient> {
    const ingredient = await Ingredient.findOne({ _id: ingredientId, restaurantId }).session(session);
    if (!ingredient) throw new AppError('Ingredient not found', 404);

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
    
    return this.adjustStock(
      restaurantId,
      ingredientId,
      purchasedQtyBaseUnit,
      ingredient.unit,
      TransactionType.PURCHASE,
      session,
      { referenceType: 'PURCHASE', referenceId: purchaseId, createdBy }
    );
  }
}
