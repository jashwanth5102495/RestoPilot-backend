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
    static async updateRestaurant(req, res, next) {
        try {
            const { id } = req.params;
            const { name, phone, email, address, city, state, pincode, gstNumber } = req.body;
            const { Restaurant } = await Promise.resolve().then(() => __importStar(require('./restaurant.model')));
            const currentRes = await Restaurant.findById(req.tenantId);
            if (!currentRes)
                return res.status(404).json({ success: false, message: 'Active restaurant context not found' });
            const rootId = currentRes.parentRestaurantId || currentRes._id;
            const targetRes = await Restaurant.findById(id);
            if (!targetRes)
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            const isAuthorized = targetRes._id.toString() === rootId.toString() ||
                (targetRes.parentRestaurantId && targetRes.parentRestaurantId.toString() === rootId.toString());
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Unauthorized to modify this restaurant profile' });
            }
            targetRes.name = name || targetRes.name;
            targetRes.phone = phone || targetRes.phone;
            targetRes.email = email || targetRes.email;
            targetRes.address = address || targetRes.address;
            targetRes.city = city || targetRes.city;
            targetRes.state = state || targetRes.state;
            targetRes.pincode = pincode || targetRes.pincode;
            targetRes.gstNumber = gstNumber || targetRes.gstNumber;
            await targetRes.save();
            res.status(200).json({ success: true, data: targetRes });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RestaurantController = RestaurantController;
