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
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../shared/utils/logger");
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        logger_1.logger.info(`✅ Successfully connected to MongoDB at ${env_1.env.MONGODB_URI}`);
        // Ensure Super Admin exists
        const { User, UserRole, UserStatus } = await Promise.resolve().then(() => __importStar(require('../modules/users/user.model')));
        const adminExists = await User.exists({ role: UserRole.SUPER_ADMIN });
        if (!adminExists) {
            const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
            const passwordHash = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'System Administrator',
                email: 'admin@restopilot.com',
                passwordHash,
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
            });
            logger_1.logger.info('👤 Default Super Admin user created (admin@restopilot.com / admin123)');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('⚠️ MongoDB disconnected');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('❌ MongoDB error:', err);
});
