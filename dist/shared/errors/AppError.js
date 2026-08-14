"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    details;
    constructor(message = 'Validation Error', details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
