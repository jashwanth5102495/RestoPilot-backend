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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../users/user.model");
const restaurant_model_1 = require("../restaurants/restaurant.model");
const env_1 = require("../../config/env");
const AppError_1 = require("../../shared/errors/AppError");
class AuthService {
    static async login(email, password) {
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (!user || user.status !== user_model_1.UserStatus.ACTIVE) {
            throw new AppError_1.UnauthorizedError('Invalid credentials or inactive account');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new AppError_1.UnauthorizedError('Invalid credentials');
        }
        const payload = {
            userId: user._id.toString(),
            restaurantId: user.restaurantId?.toString(),
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
        user.lastLoginAt = new Date();
        await user.save();
        const { passwordHash, ...userWithoutPassword } = user.toObject();
        let restaurantData = null;
        if (user.restaurantId) {
            const { Restaurant } = await Promise.resolve().then(() => __importStar(require('../restaurants/restaurant.model')));
            restaurantData = await Restaurant.findById(user.restaurantId).lean();
        }
        return {
            user: { ...userWithoutPassword, restaurant: restaurantData },
            accessToken,
            refreshToken,
        };
    }
    static async registerRestaurant(data) {
        // Transaction to ensure both restaurant and owner are created together
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Check if user already exists
            const existingUser = await user_model_1.User.findOne({ email: data.email.toLowerCase() }).session(session);
            if (existingUser) {
                throw new AppError_1.ValidationError('Email is already registered');
            }
            // 2. Create Restaurant
            const restaurant = new restaurant_model_1.Restaurant({
                name: data.restaurantName,
                phone: data.phone,
                email: data.email,
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                restaurantType: data.restaurantType,
                status: restaurant_model_1.RestaurantStatus.ACTIVE,
            });
            await restaurant.save({ session });
            // 3. Create Owner User
            const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
            const owner = new user_model_1.User({
                restaurantId: restaurant._id,
                name: data.ownerName,
                email: data.email.toLowerCase(),
                phone: data.phone,
                passwordHash,
                role: user_model_1.UserRole.OWNER,
                status: user_model_1.UserStatus.ACTIVE,
            });
            await owner.save({ session });
            // Link owner to restaurant
            restaurant.ownerId = owner._id;
            await restaurant.save({ session });
            await session.commitTransaction();
            const payload = {
                userId: owner._id.toString(),
                restaurantId: restaurant._id.toString(),
                role: owner.role,
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN });
            const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
            const { passwordHash: _, ...ownerWithoutPassword } = owner.toObject();
            return {
                user: { ...ownerWithoutPassword, restaurant: restaurant.toObject() },
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async switchBranch(userId, currentRestaurantId, targetBranchId) {
        const currentRes = await restaurant_model_1.Restaurant.findById(currentRestaurantId);
        if (!currentRes) {
            throw new Error('Current restaurant context not found');
        }
        const rootId = currentRes.parentRestaurantId || currentRes._id;
        // Check if target is authorized (either the root itself, or a branch of the root)
        const targetRes = await restaurant_model_1.Restaurant.findById(targetBranchId);
        if (!targetRes) {
            throw new Error('Target branch not found');
        }
        const isAuthorized = targetRes._id.toString() === rootId.toString() ||
            (targetRes.parentRestaurantId && targetRes.parentRestaurantId.toString() === rootId.toString());
        if (!isAuthorized) {
            throw new Error('Unauthorized to switch to this branch');
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const payload = {
            userId: user._id.toString(),
            restaurantId: targetBranchId,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
        const { passwordHash, ...userWithoutPassword } = user.toObject();
        return {
            user: { ...userWithoutPassword, restaurant: targetRes.toObject() },
            accessToken,
            refreshToken,
        };
    }
}
exports.AuthService = AuthService;
