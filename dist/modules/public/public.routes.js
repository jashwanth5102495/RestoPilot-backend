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
router.post('/settings/billing-ordering', auth_middleware_1.authenticate, tenant_middleware_1.requireTenant, public_controller_1.PublicController.toggleBillingOrdering);
router.post('/settings/kds', auth_middleware_1.authenticate, tenant_middleware_1.requireTenant, public_controller_1.PublicController.toggleKds);
// Public routes for waiter portal
router.get('/waiter/:slug/tables', public_controller_1.PublicController.getWaiterTables);
router.get('/waiter/:slug/menu', public_controller_1.PublicController.getWaiterMenu);
router.get('/waiter/:slug/tables/:tableId/order', public_controller_1.PublicController.getWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/order', public_controller_1.PublicController.placeWaiterTableOrder);
router.post('/waiter/:slug/tables/:tableId/bill', public_controller_1.PublicController.generateWaiterBill);
// Public routes for billing portal
router.get('/billing/:slug/menu', public_controller_1.PublicController.getBillingMenu);
router.post('/billing/:slug/sale', public_controller_1.PublicController.processBillingSale);
router.patch('/billing/:slug/dishes/:dishId/availability', public_controller_1.PublicController.toggleDishAvailability);
// Public routes for KDS portal
router.get('/kds/:slug/orders', public_controller_1.PublicController.getKdsOrders);
router.patch('/kds/:slug/orders/:orderId/status', public_controller_1.PublicController.updateKdsOrderStatus);
exports.default = router;
