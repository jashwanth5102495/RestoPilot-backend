"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const AppError_1 = require("../shared/errors/AppError");
const authorize = (...roles) => {
    return (req, res, next) => {
        const reqAny = req;
        if (!reqAny.user) {
            return next(new AppError_1.UnauthorizedError('Not authenticated'));
        }
        if (!roles.includes(reqAny.user.role)) {
            return next(new AppError_1.ForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
};
exports.authorize = authorize;
