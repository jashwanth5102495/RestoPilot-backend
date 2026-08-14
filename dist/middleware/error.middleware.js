"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../shared/errors/AppError");
const logger_1 = require("../shared/utils/logger");
const env_1 = require("../config/env");
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
    // Log error (hide stack in production unless operational)
    if (statusCode >= 500) {
        logger_1.logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${err.message}`, { stack: err.stack });
    }
    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code,
            details: details.length ? details : undefined,
            ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack })
        },
    });
};
exports.errorHandler = errorHandler;
