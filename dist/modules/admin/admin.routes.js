"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_model_1 = require("../users/user.model");
const AppError_1 = require("../../shared/errors/AppError");
const router = (0, express_1.Router)();
// Middleware to enforce Super Admin role
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== user_model_1.UserRole.SUPER_ADMIN) {
        return next(new AppError_1.UnauthorizedError('Requires SUPER_ADMIN role'));
    }
    next();
};
router.use(auth_middleware_1.authenticate, requireSuperAdmin);
router.get('/restaurants', admin_controller_1.AdminController.getRestaurants);
router.get('/backup/export', admin_controller_1.AdminController.exportBackup);
router.delete('/backup/wipe', admin_controller_1.AdminController.wipeBackup);
router.get('/data-requests', admin_controller_1.AdminController.getDataRequests);
router.post('/data-requests/:id/fulfill', admin_controller_1.AdminController.fulfillDataRequest);
exports.default = router;
