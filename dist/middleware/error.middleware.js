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
exports.errorHandler = void 0;
const AppError_1 = require("../shared/errors/AppError");
const logger_1 = require("../shared/utils/logger");
const env_1 = require("../config/env");
const Sentry = __importStar(require("@sentry/node"));
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = [];
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'ERROR';
        if (err instanceof AppError_1.ValidationError) {
            details = err.details;
        }
    }
    else if (err.name === 'MongoServerError' && err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate key error';
        code = 'DUPLICATE_KEY';
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Mongoose validation error';
        code = 'VALIDATION_ERROR';
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Sentry and Logging logic
    if (statusCode >= 500) {
        // Only capture unexpected 5xx errors to Sentry
        Sentry.withScope(scope => {
            scope.setExtra('reqId', req.id);
            if (req.user) {
                scope.setUser({ id: req.user.userId, role: req.user.role });
                if (req.user.restaurantId) {
                    scope.setTag('restaurantId', req.user.restaurantId);
                }
            }
            if (req.tenantId) {
                scope.setTag('tenantId', req.tenantId);
            }
            Sentry.captureException(err);
        });
        logger_1.logger.error({
            msg: 'Unhandled Exception',
            err,
            statusCode,
            requestId: req.id,
            userId: req.user?.userId,
            restaurantId: req.user?.restaurantId || req.tenantId,
        });
    }
    else {
        logger_1.logger.warn({
            msg: 'Client Error',
            errorMessage: err.message,
            statusCode,
            code,
            requestId: req.id,
        });
    }
    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code,
            details: details.length > 0 ? details : undefined,
            ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack }),
            requestId: req.id,
        },
    });
};
exports.errorHandler = errorHandler;
