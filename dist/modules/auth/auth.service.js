"use strict";
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
        return {
            user: userWithoutPassword,
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
            // Initialize defaults here (categories, settings) if needed later
            await session.commitTransaction();
            return { restaurant, ownerId: owner._id };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.AuthService = AuthService;
