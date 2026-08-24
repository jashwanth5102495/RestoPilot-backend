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
        tax: 0,
        total: 0,
        orderStatus: OrderStatus.DRAFT,
        orderSource: OrderSource.IN_STORE,
        startedBy: userId,
        createdBy: userId,
        orderActivity: [{
          action: 'ORDER_STARTED',
          userId,
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
              userId: new mongoose.Types.ObjectId(userId),
              timestamp: new Date(),
              details: `Removed ${dish.name}`
            });
          } else {
            order.items[existingItemIndex].lineTotal = order.items[existingItemIndex].quantity * order.items[existingItemIndex].unitPrice;
            order.orderActivity.push({
              action: 'ITEM_UPDATED',
              userId: new mongoose.Types.ObjectId(userId),
              timestamp: new Date(),
              details: `Updated ${dish.name} quantity to ${order.items[existingItemIndex].quantity}`
            });
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
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: new Date(),
            details: `Added ${dish.name} x${update.quantityChange}`
          });
        }
      }

      // Recalculate totals
      order.subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
      order.tax = order.subtotal * 0.05; // 5% tax example
      order.total = order.subtotal + order.tax - order.discount;

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
      userId: new mongoose.Types.ObjectId(userId),
      timestamp: new Date()
    });

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

      order.orderStatus = status;
      order.orderActivity.push({
        action: `STATUS_CHANGED_TO_${status}`,
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: new Date()
      });

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
