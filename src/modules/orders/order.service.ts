import { Order, OrderStatus, OrderSource } from './order.model';
import { Table, TableStatus } from '../tables/table.model';
import { Dish } from '../dishes/dish.model';
import mongoose from 'mongoose';
import { ValidationError } from '../../shared/errors/AppError';
import { SequenceService, runWithTransaction } from '../shared/sequence.service';
import { emitToTenant } from '../../shared/utils/socket';

export class OrderService {
  static async startTableOrder(restaurantId: string, tableId: string, userId: string) {
    return runWithTransaction(async (session) => {
      const tableQuery = Table.findOne({ _id: tableId, restaurantId, isActive: true });
      const table = await (session ? tableQuery.session(session) : tableQuery);
      if (!table) throw new ValidationError('Table not found or inactive');

      // Check for existing active order
      const existingQuery = Order.findOne({
        restaurantId,
        tableId,
        orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      });
      const existingOrder = await (session ? existingQuery.session(session) : existingQuery);

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

      await newOrder.save(session ? { session } : {});
      
      table.status = TableStatus.OCCUPIED;
      await table.save(session ? { session } : {});

      emitToTenant(restaurantId, 'order_started', { order: newOrder, tableId });
      emitToTenant(restaurantId, 'table_status_updated', { tableId, status: TableStatus.OCCUPIED });

      return newOrder;
    });
  }

  static async updateOrderItems(restaurantId: string, orderId: string, updates: any[], userId: string) {
    return runWithTransaction(async (session) => {
      const orderQuery = Order.findOne({ _id: orderId, restaurantId });
      const order = await (session ? orderQuery.session(session) : orderQuery);
      if (!order) throw new ValidationError('Order not found');
      if (order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.CANCELLED) {
        throw new ValidationError('Cannot modify a completed or cancelled order');
      }

      const kitchenBatchItems: any[] = [];

      for (const update of updates) {
        const dishQuery = Dish.findOne({ _id: update.dishId, restaurantId });
        const dish = await (session ? dishQuery.session(session) : dishQuery);
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
          const taxRate = 5;
          
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

        if (update.quantityChange > 0) {
          const batchItem = kitchenBatchItems.find(item => item.dishId.toString() === dish._id.toString());
          if (batchItem) {
            batchItem.quantity += update.quantityChange;
            batchItem.lineTotal = Number((batchItem.unitPrice * batchItem.quantity).toFixed(2));
          } else {
            kitchenBatchItems.push({
              dishId: dish._id,
              dishName: dish.name,
              quantity: update.quantityChange,
              unitPrice: dish.price,
              taxRate: 5,
              lineTotal: Number((dish.price * update.quantityChange).toFixed(2))
            });
          }
        }
      }

      // Recalculate totals
      order.subtotal = Number(order.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
      order.cgst = Number((order.subtotal * 0.025).toFixed(2));
      order.sgst = Number((order.subtotal * 0.025).toFixed(2));
      order.tax = Number((order.cgst + order.sgst).toFixed(2));
      order.total = Number((order.subtotal + order.tax - order.discount).toFixed(2));
      order.pendingKitchenItems = kitchenBatchItems;
      if (kitchenBatchItems.length > 0) {
        order.kitchenBatches = [
          ...(order.kitchenBatches || []),
          {
            batchId: new mongoose.Types.ObjectId().toString(),
            items: kitchenBatchItems,
            status: OrderStatus.PLACED,
            createdAt: new Date()
          }
        ] as any;
      }

      await order.save(session ? { session } : {});

      emitToTenant(restaurantId, 'order_updated', { order });

      return order;
    });
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
    return runWithTransaction(async (session) => {
      const orderQuery = Order.findOne({ _id: orderId, restaurantId });
      const order = await (session ? orderQuery.session(session) : orderQuery);
      if (!order) throw new ValidationError('Order not found');

      if (order.orderStatus === OrderStatus.COMPLETED && status === OrderStatus.CANCELLED) {
        throw new ValidationError('Order has already been completed and inventory consumed. Please void the associated bill to properly reverse inventory and financials.');
      }

      order.orderStatus = status;
      if (status === OrderStatus.READY || status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
        order.pendingKitchenItems = [];
      }
      order.orderActivity.push({
        action: `STATUS_CHANGED_TO_${status}`,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        timestamp: new Date()
      } as any);

      await order.save(session ? { session } : {});

      if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
        if (order.tableId) {
          const tableQuery = Table.findById(order.tableId);
          const table = await (session ? tableQuery.session(session) : tableQuery);
          if (table) {
            table.status = TableStatus.FREE;
            await table.save(session ? { session } : {});
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
            if (requirements.length > 0) {
              await Promise.all(
                requirements.map(req =>
                  InventoryService.adjustStock(
                    restaurantId,
                    req.ingredientId,
                    req.quantityInBaseUnit,
                    'BASE_UNIT',
                    TransactionType.SALE_CONSUMPTION,
                    session,
                    { referenceType: 'ORDER', referenceId: order._id as any, createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined },
                    true // Allow negative stock so order completion isn't blocked
                  )
                )
              );
            }
            order.inventoryConsumed = true;
            await order.save(session ? { session } : {});
          } catch (err) {
            console.error(`Failed to consume inventory for order ${order._id}:`, err);
            throw err;
          }
        }
      }

      emitToTenant(restaurantId, 'order_status_updated', { order });

      return order;
    });
  }

  static async updateKitchenBatchStatus(restaurantId: string, orderId: string, batchId: string, status: OrderStatus, userId: string) {
    return runWithTransaction(async (session) => {
      const orderQuery = Order.findOne({ _id: orderId, restaurantId });
      const order = await (session ? orderQuery.session(session) : orderQuery);
      if (!order) throw new ValidationError('Order not found');

      const batch = order.kitchenBatches?.find(item => item.batchId === batchId);
      if (!batch) throw new ValidationError('Kitchen batch not found');
      if (![OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY].includes(status)) {
        throw new ValidationError('Invalid kitchen batch status');
      }

      batch.status = status as OrderStatus.PLACED | OrderStatus.PREPARING | OrderStatus.READY;
      const activeBatches = (order.kitchenBatches || []).filter(item => item.status !== OrderStatus.READY);
      order.orderStatus = activeBatches.some(item => item.status === OrderStatus.PLACED)
        ? OrderStatus.PLACED
        : activeBatches.some(item => item.status === OrderStatus.PREPARING)
          ? OrderStatus.PREPARING
          : OrderStatus.READY;
      order.orderActivity.push({
        action: `KITCHEN_BATCH_${status}`,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        timestamp: new Date(),
        details: `Kitchen batch ${batchId} marked ${status}`
      } as any);

      await order.save(session ? { session } : {});
      emitToTenant(restaurantId, 'order_status_updated', { order });
      return order;
    });
  }
}
