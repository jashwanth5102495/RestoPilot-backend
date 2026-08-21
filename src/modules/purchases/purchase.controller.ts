import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Purchase } from './purchase.model';
import { SequenceService } from '../shared/sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppError } from '../../shared/errors/AppError';

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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { supplierId, items, paymentStatus, invoiceNumber, purchaseDate, notes } = req.body;
      const createdBy = req.user?.userId;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Purchase items are required', 400);
      }

      if (!createdBy) {
        throw new AppError('User session context is missing', 401);
      }

      const purchaseNumber = await SequenceService.getNextPurchaseNumber(req.tenantId!, session);

      let subtotal = 0;
      const purchaseItems = [];

      for (const item of items) {
        if (!item.ingredientId || !item.quantity || !item.unitCost) {
          throw new AppError('Each purchase item must have ingredientId, quantity, and unitCost', 400);
        }

        const lineTotal = item.quantity * item.unitCost;
        subtotal += lineTotal;

        purchaseItems.push({
          ingredientId: new Types.ObjectId(item.ingredientId),
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          unitCost: item.unitCost,
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

      // Deduct/Add stock atomically and adjust averageCost
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

      await session.commitTransaction();
      res.status(201).json({ success: true, data: purchase });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
}
