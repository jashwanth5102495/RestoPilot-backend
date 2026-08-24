"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const table_service_1 = require("./table.service");
class TableController {
    static async getTables(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const tables = await table_service_1.TableService.getTables(restaurantId);
            res.json({ success: true, data: tables });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTableCount(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const { count } = req.body;
            const result = await table_service_1.TableService.updateTableCount(restaurantId, count);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TableController = TableController;
