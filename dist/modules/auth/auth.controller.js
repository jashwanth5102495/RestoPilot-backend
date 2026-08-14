"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login(email, password);
            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async registerRestaurant(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.registerRestaurant(req.body);
            res.status(201).json({
                success: true,
                message: 'Restaurant registered successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMe(req, res, next) {
        try {
            // req.user is populated by the authenticate middleware
            res.status(200).json({
                success: true,
                data: {
                    user: req.user
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
