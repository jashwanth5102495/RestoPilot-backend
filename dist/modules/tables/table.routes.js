"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const table_controller_1 = require("./table.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const user_model_1 = require("../users/user.model");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
// Waiter, Manager, Owner, Billing can view tables
router.get('/', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.WAITER, user_model_1.UserRole.BILLING), table_controller_1.TableController.getTables);
// Only Owner and Manager can manage tables
router.patch('/count', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER), table_controller_1.TableController.updateTableCount);
router.patch('/:id', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER), table_controller_1.TableController.renameTable);
exports.default = router;
