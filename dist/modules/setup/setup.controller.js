"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupController = void 0;
const setup_service_1 = require("./setup.service");
const AppError_1 = require("../../shared/errors/AppError");
class SetupController {
    static async completeSetup(req, res, next) {
        try {
            const { ingredients, dishes } = req.body;
            const restaurantId = req.user?.restaurantId;
            const userId = req.user?.userId;
            if (!restaurantId) {
                throw new AppError_1.AppError('Restaurant ID not found in user context', 400);
            }
            if (!ingredients || !dishes) {
                throw new AppError_1.AppError('Ingredients and dishes are required', 400);
            }
            const result = await setup_service_1.SetupService.completeSetup(restaurantId.toString(), ingredients, dishes, userId?.toString());
            res.status(200).json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SetupController = SetupController;
