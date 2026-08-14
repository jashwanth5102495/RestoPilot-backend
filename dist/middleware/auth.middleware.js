"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../shared/errors/AppError");
const env_1 = require("../config/env");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError_1.UnauthorizedError('No token provided'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new AppError_1.UnauthorizedError('Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
