"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_model_1 = require("./category.model");
const AppError_1 = require("../../shared/errors/AppError");
class CategoryController {
    static async getCategories(req, res, next) {
        try {
            let categories = await category_model_1.Category.find({ restaurantId: req.tenantId }).sort({ displayOrder: 1, createdAt: -1 });
            if (categories.length === 0) {
                const defaultCategories = [
                    'Starters',
                    'Main Course',
                    'Rice & Biryani',
                    'Breads',
                    'South Indian',
                    'Desserts',
                    'Beverages',
                    'Combos & Thalis'
                ];
                const seededCategories = [];
                for (let i = 0; i < defaultCategories.length; i++) {
                    const cat = new category_model_1.Category({
                        restaurantId: req.tenantId,
                        name: defaultCategories[i],
                        description: `Default category: ${defaultCategories[i]}`,
                        displayOrder: i + 1,
                        isActive: true
                    });
                    await cat.save();
                    seededCategories.push(cat);
                }
                categories = seededCategories;
            }
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
