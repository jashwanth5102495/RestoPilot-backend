"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const user_model_1 = require("./user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = require("../../shared/errors/AppError");
class StaffService {
    static async createStaff(restaurantId, data) {
        // Check if loginId is already taken for this restaurant
        if (data.loginId) {
            const existing = await user_model_1.User.findOne({ restaurantId, loginId: data.loginId });
            if (existing) {
                throw new AppError_1.ValidationError('Login ID is already taken for this restaurant');
            }
        }
        // Check if email is provided and already taken
        if (data.email) {
            const existing = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
            if (existing) {
                throw new AppError_1.ValidationError('Email is already registered');
            }
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const newStaff = new user_model_1.User({
            restaurantId,
            name: data.name,
            email: data.email ? data.email.toLowerCase() : undefined,
            loginId: data.loginId,
            phone: data.phone,
            passwordHash,
            role: data.role,
            status: user_model_1.UserStatus.ACTIVE
        });
        await newStaff.save();
        const { passwordHash: _, ...staffWithoutPassword } = newStaff.toObject();
        return staffWithoutPassword;
    }
    static async getStaff(restaurantId) {
        const staff = await user_model_1.User.find({ restaurantId }).select('-passwordHash').sort({ createdAt: -1 });
        return staff;
    }
    static async updateStaff(restaurantId, staffId, data) {
        const staff = await user_model_1.User.findOne({ _id: staffId, restaurantId });
        if (!staff) {
            throw new AppError_1.ValidationError('Staff member not found');
        }
        if (data.name)
            staff.name = data.name;
        if (data.phone)
            staff.phone = data.phone;
        if (data.role)
            staff.role = data.role;
        if (data.status)
            staff.status = data.status;
        // We do not update loginId or email here to keep it simple, but we could if needed.
        await staff.save();
        const { passwordHash: _, ...staffWithoutPassword } = staff.toObject();
        return staffWithoutPassword;
    }
    static async resetPin(restaurantId, staffId, newPin) {
        const staff = await user_model_1.User.findOne({ _id: staffId, restaurantId });
        if (!staff) {
            throw new AppError_1.ValidationError('Staff member not found');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPin, 12);
        staff.passwordHash = passwordHash;
        await staff.save();
        return { success: true, message: 'PIN reset successfully' };
    }
}
exports.StaffService = StaffService;
