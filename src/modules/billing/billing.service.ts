import mongoose, { Types } from 'mongoose';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../orders/order.model';
import { Bill, BillStatus } from './bill.model';
import { Dish } from '../dishes/dish.model';
import { SequenceService, runWithTransaction } from '../shared/sequence.service';
import { OrderConsumptionService } from '../orders/order-consumption.service';
import { InventoryService } from '../inventory/inventory.service';
import { TransactionType } from '../inventory/inventory-transaction.model';
import { AppError } from '../../shared/errors/AppError';

export class BillingService {
  /**
   * Completes a sale: Creates Order, Deducts Inventory, Creates Bill atomically.
   */
  static async processSale(
    restaurantId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    items: { dishId: string; quantity: number }[],
    paymentMethod: PaymentMethod,
    customerId?: string | Types.ObjectId
  ) {
    return runWithTransaction(async (session) => {
      try {
        // 1. Validate dishes and calculate totals server-side
        const dishIds = items.map(i => i.dishId);
        const dishes = await Dish.find({ _id: { $in: dishIds }, restaurantId, isDeleted: { $ne: true } }).lean();
        const dishMap = new Map(dishes.map(d => [d._id.toString(), d]));

        let subtotal = 0;
        let cgst = 0;
        let sgst = 0;
        const orderItems = [];

        for (const item of items) {
          const dish = dishMap.get(item.dishId);
          if (!dish || !dish.isAvailable) {
            throw new AppError(`Dish ${item.dishId} is unavailable or invalid`, 400);
          }

          const lineTotal = dish.price * item.quantity;
          const lineTaxRate = dish.taxRate ?? 5;
          const lineCgst = Number(((lineTotal * (lineTaxRate / 2)) / 100).toFixed(2));
          const lineSgst = Number(((lineTotal * (lineTaxRate / 2)) / 100).toFixed(2));
          
          subtotal += lineTotal;
          cgst += lineCgst;
          sgst += lineSgst;

          orderItems.push({
            dishId: dish._id,
            dishName: dish.name,
            quantity: item.quantity,
            unitPrice: dish.price,
            taxRate: lineTaxRate,
            lineTotal
          });
        }

        subtotal = Number(subtotal.toFixed(2));
        cgst = Number(cgst.toFixed(2));
        sgst = Number(sgst.toFixed(2));
        const tax = Number((cgst + sgst).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));

        // 2. Create Order
        const orderNumber = await SequenceService.getNextOrderNumber(restaurantId, session);
        
        const order = new Order({
          restaurantId,
          orderNumber,
          customerId,
          items: orderItems,
          subtotal,
          discount: 0,
          tax,
          cgst,
          sgst,
          total,
          paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.COMPLETED,
          inventoryConsumed: true,
          createdBy: userId
        });

        await order.save(session ? { session } : {});

        // 3. Inventory Deduction
        const requiredIngredients = await OrderConsumptionService.calculateOrderConsumption(restaurantId, orderItems);
        
        if (requiredIngredients.length > 0) {
          await Promise.all(
            requiredIngredients.map(reqIng =>
              InventoryService.adjustStock(
                restaurantId,
                reqIng.ingredientId,
                -reqIng.quantityInBaseUnit,
                'BASE_UNIT',
                TransactionType.SALE_CONSUMPTION,
                session,
                { referenceType: 'ORDER', referenceId: order._id as Types.ObjectId, createdBy: new Types.ObjectId(userId) },
                true // Allow negative stock so billing isn't blocked
              )
            )
          );
        }

        // 4. Create Bill
        const billNumber = await SequenceService.getNextBillNumber(restaurantId, session);
        
        const bill = new Bill({
          restaurantId,
          billNumber,
          orderId: order._id,
          items: orderItems,
          subtotal,
          discount: 0,
          tax,
          cgst,
          sgst,
          total,
          paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          status: BillStatus.ACTIVE,
          issuedBy: userId
        });

        await bill.save(session ? { session } : {});

        return { order, bill };
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        
        const { logger } = require('../../shared/utils/logger');
        const Sentry = require('@sentry/node');
        
        logger.error({
          msg: 'CRITICAL: BILL_CREATION_FAILED',
          error,
          restaurantId,
          userId,
        });

        Sentry.setTag('error_type', 'BILL_CREATION_FAILED');
        Sentry.setTag('restaurantId', restaurantId.toString());
        Sentry.setExtra('userId', userId.toString());
        Sentry.setExtra('items', items);

        throw error;
      }
    });
  }

  static async voidBill(
    restaurantId: string | Types.ObjectId,
    billId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = await Bill.findOne({ _id: billId, restaurantId, status: BillStatus.ACTIVE }).session(session);
      if (!bill) throw new AppError('Active bill not found', 404);

      const order = await Order.findOne({ _id: bill.orderId, restaurantId }).session(session);
      if (!order) throw new AppError('Order not found', 404);

      // 1. Mark bill and order as cancelled
      bill.status = BillStatus.VOID;
      await bill.save({ session });

      order.orderStatus = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      await order.save({ session });

      // 2. Restore inventory
      const consumedIngredients = await OrderConsumptionService.calculateOrderConsumption(restaurantId, bill.items);
      
      for (const reqIng of consumedIngredients) {
        await InventoryService.adjustStock(
          restaurantId,
          reqIng.ingredientId,
          reqIng.quantityInBaseUnit,
          'BASE_UNIT',
          TransactionType.REVERSAL,
          session,
          { referenceType: 'BILL_VOID', referenceId: bill._id as Types.ObjectId, createdBy: new Types.ObjectId(userId), notes: `Voided bill ${bill.billNumber}` },
          true // It's restoring stock, negative stock check isn't strictly necessary
        );
      }

      await session.commitTransaction();
      return bill;
    } catch (error) {
      await session.abortTransaction();
      
      if (!(error instanceof AppError)) {
        const { logger } = require('../../shared/utils/logger');
        const Sentry = require('@sentry/node');
        
        logger.error({
          msg: 'CRITICAL: INVENTORY_REVERSAL_FAILED',
          error,
          restaurantId,
          billId,
          userId,
        });

        Sentry.setTag('error_type', 'INVENTORY_REVERSAL_FAILED');
        Sentry.setTag('restaurantId', restaurantId.toString());
        Sentry.setExtra('billId', billId.toString());
      }

      throw error;
    } finally {
      session.endSession();
    }
  }
}
