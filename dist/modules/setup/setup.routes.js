"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setup_controller_1 = require("./setup.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Secure the setup route
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/complete', setup_controller_1.SetupController.completeSetup);
exports.default = router;
