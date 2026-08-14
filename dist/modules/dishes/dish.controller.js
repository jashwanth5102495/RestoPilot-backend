"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DishController = void 0;
const dish_model_1 = require("./dish.model");
const category_model_1 = require("../categories/category.model");
const AppError_1 = require("../../shared/errors/AppError");
class DishController {
    static async getDishes(req, res, next) {
        try {
            const { categoryId } = req.query;
            const filter = { restaurantId: req.tenantId, isDeleted: false };
            if (categoryId) {
                filter.categoryId = categoryId;
            }
            const dishes = await dish_model_1.Dish.find(filter).populate('categoryId', 'name').sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: dishes });
        }
        catch (error) {
            next(error);
        }
    }
    static async createDish(req, res, next) {
        try {
            // Ensure category belongs to the tenant
            const category = await category_model_1.Category.findOne({ _id: req.body.categoryId, restaurantId: req.tenantId });
            if (!category)
                throw new AppError_1.NotFoundError('Category not found');
            const dish = await dish_model_1.Dish.create({
                ...req.body,
                restaurantId: req.tenantId,
            });
            res.status(201).json({ success: true, data: dish });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateDish(req, res, next) {
        try {
            if (req.body.categoryId) {
                const category = await category_model_1.Category.findOne({ _id: req.body.categoryId, restaurantId: req.tenantId });
                if (!category)
                    throw new AppError_1.NotFoundError('Category not found');
            }
            const dish = await dish_model_1.Dish.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId, isDeleted: false }, { $set: req.body }, { new: true, runValidators: true });
            if (!dish)
                throw new AppError_1.NotFoundError('Dish not found');
            res.status(200).json({ success: true, data: dish });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteDish(req, res, next) {
        try {
            const dish = await dish_model_1.Dish.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
            if (!dish)
                throw new AppError_1.NotFoundError('Dish not found');
            res.status(200).json({ success: true, data: {} });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DishController = DishController;
