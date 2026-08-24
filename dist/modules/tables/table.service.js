"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const table_model_1 = require("./table.model");
const order_model_1 = require("../orders/order.model");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("../../shared/errors/AppError");
const socket_1 = require("../../shared/utils/socket");
class TableService {
    static async getTables(restaurantId) {
        return await table_model_1.Table.find({ restaurantId, isActive: true }).sort({ tableNumber: 1 });
    }
    static async updateTableCount(restaurantId, newCount) {
        if (newCount < 0) {
            throw new AppError_1.ValidationError('Table count cannot be negative');
        }
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { Restaurant } = await Promise.resolve().then(() => __importStar(require('../restaurants/restaurant.model')));
            const restaurant = await Restaurant.findById(restaurantId).session(session);
            if (!restaurant) {
                throw new AppError_1.ValidationError('Restaurant not found');
            }
            const currentActiveTables = await table_model_1.Table.find({ restaurantId, isActive: true }).sort({ tableNumber: 1 }).session(session);
            const currentCount = currentActiveTables.length;
            if (newCount > currentCount) {
                // Increase tables
                const tablesToCreate = [];
                let maxTableNumber = 0;
                // Find highest existing table number (active or inactive) to prevent conflicts
                const highestTable = await table_model_1.Table.findOne({ restaurantId }).sort({ tableNumber: -1 }).session(session);
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
                        status: table_model_1.TableStatus.FREE
                    });
                }
                await table_model_1.Table.insertMany(tablesToCreate, { session });
            }
            else if (newCount < currentCount) {
                // Decrease tables
                const removeCount = currentCount - newCount;
                // We deactivate from the end (highest table numbers)
                const tablesToDeactivate = currentActiveTables.slice(-removeCount);
                for (const table of tablesToDeactivate) {
                    // Check for active orders
                    const activeOrder = await order_model_1.Order.findOne({
                        restaurantId,
                        tableId: table._id,
                        orderStatus: { $nin: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] }
                    }).session(session);
                    if (activeOrder) {
                        throw new AppError_1.ValidationError(`Cannot reduce tables because ${table.name || 'Table ' + table.tableNumber} has an active order.`);
                    }
                    table.isActive = false;
                    await table.save({ session });
                }
            }
            restaurant.tableCount = newCount;
            await restaurant.save({ session });
            await session.commitTransaction();
            (0, socket_1.emitToTenant)(restaurantId, 'tables_updated', { count: newCount });
            return { success: true, message: `Table count updated to ${newCount}` };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async updateTableStatus(restaurantId, tableId, status) {
        const table = await table_model_1.Table.findOneAndUpdate({ _id: tableId, restaurantId }, { status }, { new: true });
        if (!table)
            throw new AppError_1.ValidationError('Table not found');
        (0, socket_1.emitToTenant)(restaurantId, 'table_status_updated', { tableId, status });
        return table;
    }
}
exports.TableService = TableService;
