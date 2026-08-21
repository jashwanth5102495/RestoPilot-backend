"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const supplier_model_1 = require("./supplier.model");
class SupplierController {
    static async getSuppliers(req, res, next) {
        try {
            const suppliers = await supplier_model_1.Supplier.find({ restaurantId: req.tenantId, isDeleted: false })
                .sort({ name: 1 })
                .lean();
            res.status(200).json({ success: true, data: suppliers });
        }
        catch (error) {
            next(error);
        }
    }
    static async createSupplier(req, res, next) {
        try {
            const { name, phone, email, address, gstNumber, notes } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: 'Supplier name is required' });
            }
            const supplier = new supplier_model_1.Supplier({
                restaurantId: req.tenantId,
                name,
                phone,
                email,
                address,
                gstNumber,
                notes,
            });
            await supplier.save();
            res.status(201).json({ success: true, data: supplier });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSupplier(req, res, next) {
        try {
            const { id } = req.params;
            const { name, phone, email, address, gstNumber, notes, isActive } = req.body;
            const supplier = await supplier_model_1.Supplier.findOneAndUpdate({ _id: id, restaurantId: req.tenantId, isDeleted: false }, { name, phone, email, address, gstNumber, notes, isActive }, { new: true });
            if (!supplier) {
                return res.status(404).json({ success: false, message: 'Supplier not found' });
            }
            res.status(200).json({ success: true, data: supplier });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteSupplier(req, res, next) {
        try {
            const { id } = req.params;
            const supplier = await supplier_model_1.Supplier.findOneAndUpdate({ _id: id, restaurantId: req.tenantId, isDeleted: false }, { isDeleted: true }, { new: true });
            if (!supplier) {
                return res.status(404).json({ success: false, message: 'Supplier not found' });
            }
            res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SupplierController = SupplierController;
