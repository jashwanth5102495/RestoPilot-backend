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
exports.requireTenant = void 0;
const AppError_1 = require("../shared/errors/AppError");
const user_model_1 = require("../modules/users/user.model");
const Sentry = __importStar(require("@sentry/node"));
const requireTenant = (req, res, next) => {
    const reqAny = req;
    if (!reqAny.user) {
        return next(new AppError_1.UnauthorizedError('Not authenticated'));
    }
    // Super admins are not strictly bound to one tenant for their own operations,
    // but if they operate on a specific tenant, it should be specified (e.g. via params or body).
    // For normal users, they MUST have a restaurantId in their token.
    if (reqAny.user.role !== user_model_1.UserRole.SUPER_ADMIN && !reqAny.user.restaurantId) {
        return next(new AppError_1.ForbiddenError('User does not belong to a restaurant'));
    }
    if (reqAny.user.restaurantId) {
        reqAny.tenantId = reqAny.user.restaurantId;
        Sentry.setTag('tenantId', reqAny.tenantId);
    }
    next();
};
exports.requireTenant = requireTenant;
