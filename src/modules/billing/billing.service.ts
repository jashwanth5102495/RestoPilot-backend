import mongoose, { Types } from 'mongoose';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../orders/order.model';
import { Bill, BillStatus } from './bill.model';
import { Dish } from '../dishes/dish.model';
import { SequenceService } from '../shared/sequence.service';
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate dishes and calculate totals server-side
      const dishIds = items.map(i => i.dishId);
      const dishes = await Dish.find({ _id: { $in: dishIds }, restaurantId, isDeleted: false }).session(session);
      const dishMap = new Map(dishes.map(d => [d._id.toString(), d]));

      let subtotal = 0;
      let tax = 0;
      const orderItems = [];

      for (const item of items) {
        const dish = dishMap.get(item.dishId);
        if (!dish || !dish.isAvailable) {
          throw new AppError(`Dish ${item.dishId} is unavailable or invalid`, 400);
        }

        const lineTotal = dish.price * item.quantity;
        const lineTax = (lineTotal * dish.taxRate) / 100;
        
        subtotal += lineTotal;
        tax += lineTax;

        orderItems.push({
          dishId: dish._id,
          dishName: dish.name,
          quantity: item.quantity,
          unitPrice: dish.price,
          taxRate: dish.taxRate,
          lineTotal
        });
      }

      const total = subtotal + tax; // Add discount logic later if needed

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
        total,
        paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.COMPLETED,
        inventoryConsumed: true,
        createdBy: userId
      });

      await order.save({ session });

      // 3. Inventory Deduction
      const requiredIngredients = await OrderConsumptionService.calculateOrderConsumption(restaurantId, orderItems);
      
      for (const reqIng of requiredIngredients) {
        // deductStock atomically ensures we don't go negative if not allowed
        await InventoryService.adjustStock(
          restaurantId,
          reqIng.ingredientId,
          -reqIng.quantityInBaseUnit,
          'BASE_UNIT', 
               // We passed `quantityInBaseUnit`, so we can pass any base unit, e.g. the ingredient's actual base unit.
               // We need a slight modification to `adjustStock` to accept base quantities safely.
          TransactionType.SALE_CONSUMPTION,
          session,
          { referenceType: 'ORDER', referenceId: order._id as Types.ObjectId, createdBy: new Types.ObjectId(userId) },
          false // Prevent negative stock
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
        total,
        paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        status: BillStatus.ACTIVE,
        issuedBy: userId
      });

      await bill.save({ session });

      await session.commitTransaction();

      return { order, bill };
    } catch (error) {
      await session.abortTransaction();

      // Differentiate expected vs unexpected errors
      if (error instanceof AppError) {
        // Expected validation or business logic error (e.g. INSUFFICIENT_STOCK)
        throw error;
      }
      
      const { logger } = require('../../shared/utils/logger');
      const Sentry = require('@sentry/node');
      
      // Unexpected catastrophic billing/inventory crash
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
    } finally {
      session.endSession();
    }
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
