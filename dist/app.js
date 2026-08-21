"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
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
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
    });
});
app.get('/ready', (req, res) => {
    res.status(200).send('ready');
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
// Global Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
