import { Order, OrderStatus, OrderSource } from './order.model';
import { Table, TableStatus } from '../tables/table.model';
import { Dish } from '../dishes/dish.model';
import mongoose from 'mongoose';
import { ValidationError } from '../../shared/errors/AppError';
import { SequenceService } from '../shared/sequence.service';
import { emitToTenant } from '../../shared/utils/socket';

export class OrderService {
  static async startTableOrder(restaurantId: string, tableId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const table = await Table.findOne({ _id: tableId, restaurantId, isActive: true }).session(session);
      if (!table) throw new ValidationError('Table not found or inactive');

      // Check for existing active order
      const existingOrder = await Order.findOne({
        restaurantId,
        tableId,
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      }).session(session);

      if (existingOrder) {
        throw new ValidationError('Table already has an active order');
      }

      const orderNumber = await SequenceService.getNextOrderNumber(restaurantId, session);

      const newOrder = new Order({
        restaurantId,
        tableId,
        orderNumber,
        items: [],
        subtotal: 0,
        cgst: 0,
        sgst: 0,
        tax: 0,
        total: 0,
        orderStatus: OrderStatus.DRAFT,
        orderSource: OrderSource.IN_STORE,
        startedBy: userId,
        createdBy: userId,
        orderActivity: [{
          action: 'ORDER_STARTED',
          userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
          timestamp: new Date()
        }]
      });

      await newOrder.save({ session });
      
      table.status = TableStatus.OCCUPIED;
      await table.save({ session });

      await session.commitTransaction();

      emitToTenant(restaurantId, 'order_started', { order: newOrder, tableId });
      emitToTenant(restaurantId, 'table_status_updated', { tableId, status: TableStatus.OCCUPIED });

      return newOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateOrderItems(restaurantId: string, orderId: string, updates: any[], userId: string) {
    // updates: { dishId, quantityChange } (quantityChange can be positive or negative)
    // We use a transaction to safely fetch prices and update the document
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findOne({ _id: orderId, restaurantId }).session(session);
      if (!order) throw new ValidationError('Order not found');
      if (order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.CANCELLED) {
        throw new ValidationError('Cannot modify a completed or cancelled order');
      }

      for (const update of updates) {
        const dish = await Dish.findOne({ _id: update.dishId, restaurantId }).session(session);
        if (!dish) throw new ValidationError(`Dish ${update.dishId} not found`);

        const existingItemIndex = order.items.findIndex(item => item.dishId.toString() === update.dishId.toString());
        
        if (existingItemIndex > -1) {
          order.items[existingItemIndex].quantity += update.quantityChange;
          
          if (order.items[existingItemIndex].quantity <= 0) {
            order.items.splice(existingItemIndex, 1);
            order.orderActivity.push({
              action: 'ITEM_REMOVED',
              userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
              timestamp: new Date(),
              details: `Removed ${dish.name}`
            } as any);
          } else {
            order.items[existingItemIndex].lineTotal = order.items[existingItemIndex].quantity * order.items[existingItemIndex].unitPrice;
            order.orderActivity.push({
              action: 'ITEM_UPDATED',
              userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
              timestamp: new Date(),
              details: `Updated ${dish.name} quantity to ${order.items[existingItemIndex].quantity}`
            } as any);
          }
        } else if (update.quantityChange > 0) {
          const unitPrice = dish.price;
          const taxRate = 5; // Simplified tax for now
          
          order.items.push({
            dishId: dish._id,
            dishName: dish.name,
            quantity: update.quantityChange,
            unitPrice,
            taxRate,
            lineTotal: unitPrice * update.quantityChange,
            addedBy: new mongoose.Types.ObjectId(userId)
          });

          order.orderActivity.push({
            action: 'ITEM_ADDED',
            userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
            timestamp: new Date(),
            details: `Added ${dish.name} x${update.quantityChange}`
          } as any);
        }
      }

      // Recalculate totals
      order.subtotal = Number(order.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
      order.cgst = Number((order.subtotal * 0.025).toFixed(2));
      order.sgst = Number((order.subtotal * 0.025).toFixed(2));
      order.tax = Number((order.cgst + order.sgst).toFixed(2));
      order.total = Number((order.subtotal + order.tax - order.discount).toFixed(2));

      await order.save({ session });
      await session.commitTransaction();

      emitToTenant(restaurantId, 'order_updated', { order });

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async sendOrder(restaurantId: string, orderId: string, userId: string) {
    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) throw new ValidationError('Order not found');
    
    if (order.items.length === 0) throw new ValidationError('Cannot send an empty order');
    
    order.orderStatus = OrderStatus.PLACED;
    order.orderActivity.push({
      action: 'ORDER_SENT',
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      timestamp: new Date()
    } as any);

    await order.save();
    
    emitToTenant(restaurantId, 'order_sent', { order });

    return order;
  }

  static async updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findOne({ _id: orderId, restaurantId }).session(session);
      if (!order) throw new ValidationError('Order not found');

      if (order.orderStatus === OrderStatus.COMPLETED && status === OrderStatus.CANCELLED) {
        throw new ValidationError('Order has already been completed and inventory consumed. Please void the associated bill to properly reverse inventory and financials.');
      }

      order.orderStatus = status;
      order.orderActivity.push({
        action: `STATUS_CHANGED_TO_${status}`,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        timestamp: new Date()
      } as any);

      await order.save({ session });

      if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
        if (order.tableId) {
          const table = await Table.findById(order.tableId).session(session);
          if (table) {
            table.status = TableStatus.FREE;
            await table.save({ session });
            emitToTenant(restaurantId, 'table_status_updated', { tableId: order.tableId, status: TableStatus.FREE });
          }
        }
        
        // Consume inventory if completed and not already consumed
        if (status === OrderStatus.COMPLETED && !order.inventoryConsumed) {
          try {
            const { OrderConsumptionService } = await import('./order-consumption.service');
            const { InventoryService } = await import('../inventory/inventory.service');
            const { TransactionType } = await import('../inventory/inventory-transaction.model');
            
            const requirements = await OrderConsumptionService.calculateOrderConsumption(restaurantId, order.items);
            for (const req of requirements) {
              await InventoryService.adjustStock(
                restaurantId,
                req.ingredientId,
                req.quantityInBaseUnit,
                'BASE_UNIT',
                TransactionType.SALE_CONSUMPTION,
                session,
                { referenceType: 'ORDER', referenceId: order._id as any, createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined },
                true // Allow negative stock so order completion isn't blocked
              );
            }
            order.inventoryConsumed = true;
            await order.save({ session });
          } catch (err) {
            console.error(`Failed to consume inventory for order ${order._id}:`, err);
            throw err; // Re-throw to abort transaction if inventory deduction fails
          }
        }
      }

      await session.commitTransaction();
      
      emitToTenant(restaurantId, 'order_status_updated', { order });

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
