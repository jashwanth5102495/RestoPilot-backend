"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantController = void 0;
const restaurant_service_1 = require("./restaurant.service");
const agent_model_1 = require("../admin/agent.model");
class RestaurantController {
    static async getBranches(req, res, next) {
        try {
            const branches = await restaurant_service_1.RestaurantService.getBranches(req.tenantId);
            res.status(200).json({ success: true, data: branches });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchDashboard(req, res, next) {
        try {
            const dashboard = await restaurant_service_1.RestaurantService.getBranchDashboard(req.tenantId, req.params.branchId);
            res.status(200).json({ success: true, data: dashboard });
        }
        catch (error) {
            next(error);
        }
    }
    static async createBranch(req, res, next) {
        try {
            const newBranch = await restaurant_service_1.RestaurantService.createBranch(req.tenantId, req.body);
            res.status(201).json({ success: true, data: newBranch });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyAgent(req, res, next) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Agent code is required' });
            }
            const agent = await agent_model_1.Agent.findOne({ code: code.toUpperCase().trim(), status: 'ACTIVE' });
            if (!agent) {
                return res.status(400).json({ success: false, message: 'Invalid or inactive agent code' });
            }
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    agentName: agent.name
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RestaurantController = RestaurantController;
