"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const user_model_1 = require("../users/user.model");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.get('/', order_controller_1.OrderController.getOrders);
// Waiter actions
router.post('/table', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.WAITER), order_controller_1.OrderController.startTableOrder);
router.patch('/:orderId/items', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.WAITER), order_controller_1.OrderController.updateOrderItems);
router.post('/:orderId/send', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.WAITER), order_controller_1.OrderController.sendOrder);
// Kitchen actions
router.patch('/:orderId/status', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.KITCHEN), order_controller_1.OrderController.updateOrderStatus);
exports.default = router;
