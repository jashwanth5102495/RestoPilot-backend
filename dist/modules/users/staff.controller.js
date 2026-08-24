"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const staff_service_1 = require("./staff.service");
class StaffController {
    static async createStaff(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const staff = await staff_service_1.StaffService.createStaff(restaurantId, req.body);
            res.status(201).json({ success: true, data: staff });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStaff(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const staff = await staff_service_1.StaffService.getStaff(restaurantId);
            res.json({ success: true, data: staff });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStaff(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const { id } = req.params;
            const staff = await staff_service_1.StaffService.updateStaff(restaurantId, id, req.body);
            res.json({ success: true, data: staff });
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPin(req, res, next) {
        try {
            const restaurantId = req.tenantId;
            const { id } = req.params;
            const { pin } = req.body;
            const result = await staff_service_1.StaffService.resetPin(restaurantId, id, pin);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StaffController = StaffController;
