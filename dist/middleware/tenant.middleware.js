"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = void 0;
const AppError_1 = require("../shared/errors/AppError");
const user_model_1 = require("../modules/users/user.model");
const requireTenant = (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.UnauthorizedError('Not authenticated'));
    }
    // Super admins are not strictly bound to one tenant for their own operations,
    // but if they operate on a specific tenant, it should be specified (e.g. via params or body).
    // For normal users, they MUST have a restaurantId in their token.
    if (req.user.role !== user_model_1.UserRole.SUPER_ADMIN && !req.user.restaurantId) {
        return next(new AppError_1.ForbiddenError('User does not belong to a restaurant'));
    }
    if (req.user.restaurantId) {
        req.tenantId = req.user.restaurantId;
    }
    next();
};
exports.requireTenant = requireTenant;
