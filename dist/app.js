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
const Sentry = __importStar(require("@sentry/node"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const logger_1 = require("./shared/utils/logger");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const category_routes_1 = __importDefault(require("./modules/categories/category.routes"));
const dish_routes_1 = __importDefault(require("./modules/dishes/dish.routes"));
const ingredient_routes_1 = __importDefault(require("./modules/ingredients/ingredient.routes"));
const billing_routes_1 = __importDefault(require("./modules/billing/billing.routes"));
const setup_routes_1 = __importDefault(require("./modules/setup/setup.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const public_routes_1 = __importDefault(require("./modules/public/public.routes"));
const restaurant_routes_1 = __importDefault(require("./modules/restaurants/restaurant.routes"));
const order_routes_1 = __importDefault(require("./modules/orders/order.routes"));
const recipe_routes_1 = __importDefault(require("./modules/recipes/recipe.routes"));
const supplier_routes_1 = __importDefault(require("./modules/suppliers/supplier.routes"));
const purchase_routes_1 = __importDefault(require("./modules/purchases/purchase.routes"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request ID Middleware
app.use((req, res, next) => {
    const reqId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.id = reqId;
    res.setHeader('X-Request-ID', req.id);
    Sentry.setTag('reqId', req.id);
    next();
});
// Structured Logging with Pino
app.use((0, pino_http_1.default)({
    logger: logger_1.logger,
    genReqId: (req) => req.id,
    customProps: (req, res) => {
        return {
            environment: env_1.env.NODE_ENV
        };
    },
    serializers: {
        req: (req) => {
            // Safely serialize request without sensitive data
            return {
                id: req.id,
                method: req.method,
                url: req.url,
            };
        }
    }
}));
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'restopilot-api',
        timestamp: new Date().toISOString(),
    });
});
app.get('/ready', (req, res) => {
    const isDbConnected = mongoose_1.default.connection.readyState === 1;
    if (!isDbConnected) {
        return res.status(503).json({
            status: 'error',
            service: 'restopilot-api',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
        });
    }
    res.status(200).json({
        status: 'ready',
        service: 'restopilot-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.use('/api/v1/auth', apiLimiter, auth_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/dishes', dish_routes_1.default);
app.use('/api/v1/ingredients', ingredient_routes_1.default);
app.use('/api/v1/billing', billing_routes_1.default);
app.use('/api/v1/setup', setup_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/public', public_routes_1.default);
app.use('/api/v1/restaurants', restaurant_routes_1.default);
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/recipes', recipe_routes_1.default);
app.use('/api/v1/suppliers', supplier_routes_1.default);
app.use('/api/v1/purchases', purchase_routes_1.default);
app.use('/api/v1', (req, res) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
});
// Sentry Request Error Handler (Must be before our custom error handler)
Sentry.setupExpressErrorHandler(app);
// Global Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
