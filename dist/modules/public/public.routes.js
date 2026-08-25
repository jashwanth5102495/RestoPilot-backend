"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_controller_1 = require("./public.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Public routes for customers
router.get('/restaurants/:slug', public_controller_1.PublicController.getRestaurantMenu);
router.post('/restaurants/:slug/orders', public_controller_1.PublicController.placeOrder);
// Protected routes for owners
router.post('/settings/online-ordering', auth_middleware_1.authenticate, tenant_middleware_1.requireTenant, public_controller_1.PublicController.toggleOnlineOrdering);
router.post('/settings/waiter-ordering', auth_middleware_1.authenticate, tenant_middleware_1.requireTenant, public_controller_1.PublicController.toggleWaiterOrdering);
// Public routes for waiter portal
router.get('/waiter/:slug/tables', public_controller_1.PublicController.getWaiterTables);
router.get('/waiter/:slug/menu', public_controller_1.PublicController.getWaiterMenu);
router.post('/waiter/:slug/tables/:tableId/order', public_controller_1.PublicController.placeWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/bill', public_controller_1.PublicController.generateWaiterBill);
exports.default = router;
