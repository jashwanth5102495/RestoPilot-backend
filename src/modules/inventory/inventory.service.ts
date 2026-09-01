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
    session?: ClientSession | null,
    referenceDetails?: { referenceType?: string; referenceId?: Types.ObjectId; notes?: string; createdBy?: Types.ObjectId },
    allowNegativeStock: boolean = false
  ): Promise<IIngredient> {
    let query = Ingredient.findOne({ _id: ingredientId, restaurantId });
    if (session) query = query.session(session);
    const ingredient = await query;
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
    }], session ? { session } : {});

    // Update ingredient
    ingredient.currentStock = newBalance;
    await ingredient.save(session ? { session } : {});

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

  /**
   * Submits a batch of physical stock checks
   */
  static async submitPhysicalChecks(
    restaurantId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    checks: {
      ingredientId: string;
      actualQuantity: number; // Given in base unit directly from the frontend
      reason?: string;
      notes?: string;
    }[]
  ) {
    const mongoose = require('mongoose');
    const { PhysicalStockCheck } = require('./physical-stock-check.model');
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const results = [];
      
      for (const check of checks) {
        const ingredient = await Ingredient.findOne({ _id: check.ingredientId, restaurantId, isDeleted: false }).session(session);
        if (!ingredient) throw new AppError(`Ingredient ${check.ingredientId} not found`, 404);

        const estimatedQuantity = ingredient.currentStock;
        const actualQuantity = check.actualQuantity;
        const variance = actualQuantity - estimatedQuantity;
        
        let variancePercentage = 0;
        if (estimatedQuantity > 0) {
          variancePercentage = (variance / estimatedQuantity) * 100;
        } else if (estimatedQuantity === 0 && actualQuantity > 0) {
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
          await this.adjustStock(
            restaurantId,
            ingredient._id,
            variance,
            'BASE_UNIT',
            TransactionType.PHYSICAL_STOCK_ADJUSTMENT,
            session,
            { referenceType: 'PHYSICAL_CHECK', referenceId: checkRecord._id, notes: check.notes, createdBy: new Types.ObjectId(userId) },
            true // Allow negative adjustment if actual < 0 (unlikely but safe)
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
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
