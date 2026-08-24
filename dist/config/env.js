"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string().default('mongodb://127.0.0.1:27017/restopilot'),
    JWT_ACCESS_SECRET: zod_1.z.string().default('fallback_access_secret_do_not_use_in_prod'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('fallback_refresh_secret_do_not_use_in_prod'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    LOG_LEVEL: zod_1.z.string().default('info'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables', _env.error.format());
    throw new Error('Invalid environment variables');
}
exports.env = _env.data;
