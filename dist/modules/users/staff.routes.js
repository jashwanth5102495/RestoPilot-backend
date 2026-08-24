"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("./staff.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const user_model_1 = require("./user.model");
const router = (0, express_1.Router)();
// All staff endpoints require authentication, tenant, and ADMIN (OWNER/MANAGER) role
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant, (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER));
router.get('/', staff_controller_1.StaffController.getStaff);
router.post('/', staff_controller_1.StaffController.createStaff);
router.patch('/:id', staff_controller_1.StaffController.updateStaff);
router.patch('/:id/reset-pin', staff_controller_1.StaffController.resetPin);
exports.default = router;
