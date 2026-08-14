"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_model_1 = require("./category.model");
const AppError_1 = require("../../shared/errors/AppError");
class CategoryController {
    static async getCategories(req, res, next) {
        try {
            const categories = await category_model_1.Category.find({ restaurantId: req.tenantId }).sort({ displayOrder: 1, createdAt: -1 });
            res.status(200).json({ success: true, data: categories });
        }
        catch (error) {
            next(error);
        }
    }
    static async createCategory(req, res, next) {
        try {
            const category = await category_model_1.Category.create({
                ...req.body,
                restaurantId: req.tenantId,
            });
            res.status(201).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateCategory(req, res, next) {
        try {
            const category = await category_model_1.Category.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId }, { $set: req.body }, { new: true, runValidators: true });
            if (!category)
                throw new AppError_1.NotFoundError('Category not found');
            res.status(200).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteCategory(req, res, next) {
        try {
            const category = await category_model_1.Category.findOneAndDelete({ _id: req.params.id, restaurantId: req.tenantId });
            if (!category)
                throw new AppError_1.NotFoundError('Category not found');
            res.status(200).json({ success: true, data: {} });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoryController = CategoryController;
