import { Table, TableStatus } from './table.model';
import { Order, OrderStatus } from '../orders/order.model';
import mongoose from 'mongoose';
import { ValidationError } from '../../shared/errors/AppError';
import { emitToTenant } from '../../shared/utils/socket';

export class TableService {
  static async getTables(restaurantId: string) {
    return await Table.find({ restaurantId, isActive: true }).sort({ tableNumber: 1 });
  }

  static async updateTableCount(restaurantId: string, newCount: number) {
    if (newCount < 0) {
      throw new ValidationError('Table count cannot be negative');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { Restaurant } = await import('../restaurants/restaurant.model');
      const restaurant = await Restaurant.findById(restaurantId).session(session);
      if (!restaurant) {
        throw new ValidationError('Restaurant not found');
      }

      const currentActiveTables = await Table.find({ restaurantId, isActive: true }).sort({ tableNumber: 1 }).session(session);
      const currentCount = currentActiveTables.length;

      if (newCount > currentCount) {
        // Increase tables
        const tablesToCreate = [];
        let maxTableNumber = 0;
        
        // Find highest existing table number (active or inactive) to prevent conflicts
        const highestTable = await Table.findOne({ restaurantId }).sort({ tableNumber: -1 }).session(session);
        if (highestTable) {
          maxTableNumber = highestTable.tableNumber;
        }

        const addCount = newCount - currentCount;
        for (let i = 1; i <= addCount; i++) {
          const num = maxTableNumber + i;
          tablesToCreate.push({
            restaurantId,
            tableNumber: num,
            name: `Table ${num}`,
            isActive: true,
            status: TableStatus.FREE
          });
        }
        await Table.insertMany(tablesToCreate, { session });
      } else if (newCount < currentCount) {
        // Decrease tables
        const removeCount = currentCount - newCount;
        // We deactivate from the end (highest table numbers)
        const tablesToDeactivate = currentActiveTables.slice(-removeCount);
        
        for (const table of tablesToDeactivate) {
          // Check for active orders
          const activeOrder = await Order.findOne({
            restaurantId,
            tableId: table._id,
            orderStatus: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
          }).session(session);

          if (activeOrder) {
            throw new ValidationError(`Cannot reduce tables because ${table.name || 'Table ' + table.tableNumber} has an active order.`);
          }
          table.isActive = false;
          await table.save({ session });
        }
      }

      restaurant.tableCount = newCount;
      await restaurant.save({ session });

      await session.commitTransaction();
      emitToTenant(restaurantId, 'tables_updated', { count: newCount });
      return { success: true, message: `Table count updated to ${newCount}` };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateTableStatus(restaurantId: string, tableId: string, status: TableStatus) {
    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurantId },
      { status },
      { new: true }
    );
    if (!table) throw new ValidationError('Table not found');
    emitToTenant(restaurantId, 'table_status_updated', { tableId, status });
    return table;
  }

  static async renameTable(restaurantId: string, tableId: string, newName: string) {
    if (!newName || newName.trim() === '') {
      throw new ValidationError('Table name cannot be empty');
    }
    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurantId },
      { name: newName.trim() },
      { new: true }
    );
    if (!table) throw new ValidationError('Table not found');
    emitToTenant(restaurantId, 'tables_updated', {}); // Tell clients a table was renamed
    return { success: true, data: table };
  }
}
