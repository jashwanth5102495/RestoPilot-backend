import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Purchase } from './purchase.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { runWithTransaction, SequenceService } from '../shared/sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppError } from '../../shared/errors/AppError';
import { UnitConverter } from '../../shared/utils/unit-converter';

export class PurchaseController {
  static async getPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const purchases = await Purchase.find({ restaurantId: req.tenantId })
        .populate('supplierId', 'name email phone')
        .populate('items.ingredientId', 'name unit')
        .sort({ purchaseDate: -1 })
        .lean();

      res.status(200).json({ success: true, data: purchases });
    } catch (error) {
      next(error);
    }
  }

  static async createPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const purchase = await runWithTransaction(async (session) => {
        const { supplierId, items, paymentStatus, invoiceNumber, purchaseDate, notes } = req.body;
        const createdBy = req.user?.userId;

        if (!items || !Array.isArray(items) || items.length === 0) {
          throw new AppError('Purchase items are required', 400);
        }

        if (!createdBy || !Types.ObjectId.isValid(createdBy)) {
          throw new AppError('User session context is missing or invalid', 401);
        }

        if (supplierId && !Types.ObjectId.isValid(supplierId)) {
          throw new AppError(`Invalid supplier ID: ${supplierId}`, 400);
        }

        const purchaseNumber = await SequenceService.getNextPurchaseNumber(req.tenantId!, session);

        let subtotal = 0;
        const purchaseItems = [];

        for (const item of items) {
        if (!item.ingredientId || !item.quantity || item.unitCost === undefined || item.unitCost === null) {
          throw new AppError('Each purchase item must have ingredientId, quantity, and unitCost', 400);
        }

        if (!Types.ObjectId.isValid(item.ingredientId)) {
          throw new AppError(`Invalid ingredient ID: ${item.ingredientId}`, 400);
        }

        const quantity = Number(item.quantity);
        const unitCost = Number(item.unitCost);
        const unit = String(item.unit || 'pcs').toLowerCase();
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
          throw new AppError('Purchase quantity must be greater than zero and unit cost must be a valid non-negative number', 400);
        }

        let ingredientQuery = Ingredient.findOne({
          _id: item.ingredientId,
          restaurantId: req.tenantId,
          isDeleted: false,
        });
        if (session) ingredientQuery = ingredientQuery.session(session);
        const ingredient = await ingredientQuery;
        if (!ingredient) {
          throw new AppError(`Ingredient not found: ${item.ingredientId}`, 404);
        }

        if (!UnitConverter.areCompatible(unit, ingredient.unit)) {
          throw new AppError(`Incompatible units: ${unit} cannot be applied to ${ingredient.unit}`, 400);
        }

        const quantityInBaseUnits = UnitConverter.toBaseUnit(quantity, unit);
        const unitCostInBaseUnits = unitCost / UnitConverter.toBaseUnit(1, unit);
        const lineTotal = quantity * unitCost;
        subtotal += lineTotal;

          purchaseItems.push({
            ingredientId: new Types.ObjectId(item.ingredientId),
            quantity: quantityInBaseUnits,
            unit: ingredient.unit,
            unitCost: unitCostInBaseUnits,
            lineTotal
          });
        }

        const total = subtotal; // Tax or discount can be implemented later

        const purchase = new Purchase({
          restaurantId: req.tenantId,
          purchaseNumber,
          supplierId: supplierId ? new Types.ObjectId(supplierId) : undefined,
          items: purchaseItems,
          subtotal,
          tax: 0,
          total,
          paymentStatus: paymentStatus || 'PENDING',
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          invoiceNumber,
          notes,
          createdBy: new Types.ObjectId(createdBy)
        });

        await purchase.save({ session });

        // Update stock in the same transaction when MongoDB supports transactions.
        for (const item of purchaseItems) {
          await InventoryService.addPurchaseStock(
            req.tenantId!,
            item.ingredientId,
            item.quantity,
            item.unitCost,
            purchase._id as Types.ObjectId,
            new Types.ObjectId(createdBy),
            session
          );
        }

        return purchase;
      });
      res.status(201).json({ success: true, data: purchase });
    } catch (error) {
      next(error);
    }
  }
}
