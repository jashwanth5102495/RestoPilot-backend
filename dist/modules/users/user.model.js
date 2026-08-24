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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["AGENT"] = "AGENT";
    UserRole["OWNER"] = "OWNER";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["BILLING"] = "BILLING";
    UserRole["WAITER"] = "WAITER";
    UserRole["KITCHEN"] = "KITCHEN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
const UserSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant' },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, sparse: true },
    loginId: { type: String },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    avatar: { type: String },
    lastLoginAt: { type: Date },
}, { timestamps: true });
// Users are unique per restaurant by email. If restaurantId is null (e.g. Super Admin), email is unique globally.
UserSchema.index({ restaurantId: 1, email: 1 }, { unique: true, sparse: true });
UserSchema.index({ restaurantId: 1, loginId: 1 }, { unique: true, sparse: true });
exports.User = mongoose_1.default.model('User', UserSchema);
