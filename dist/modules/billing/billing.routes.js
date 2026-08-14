"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = require("./billing.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const user_model_1 = require("../users/user.model");
const billing_schema_1 = require("./billing.schema");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
// Only specific roles can process sales
router.post('/sale', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER, user_model_1.UserRole.MANAGER, user_model_1.UserRole.CASHIER), (0, validation_middleware_1.validate)(billing_schema_1.processSaleSchema), billing_controller_1.BillingController.processSale);
router.post('/subscription/pay', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER), billing_controller_1.BillingController.paySubscription);
router.post('/data-request/pay', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER), billing_controller_1.BillingController.payDataRequest);
router.get('/data-requests', (0, role_middleware_1.authorize)(user_model_1.UserRole.OWNER), billing_controller_1.BillingController.getDataRequests);
exports.default = router;
