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
            const filter = { restaurantId: req.tenantId, isDeleted: { $ne: true } };
            if (categoryId) {
                filter.categoryId = categoryId;
            }
            const dishes = await dish_model_1.Dish.find(filter).populate('categoryId', 'name').sort({ displayOrder: 1, createdAt: -1 }).lean();
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
            let { categoryId, name, price, taxRate, description, isAvailable, image } = req.body;
            if (typeof categoryId === 'object' && categoryId?._id) {
                categoryId = categoryId._id;
            }
            if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
                const category = await category_model_1.Category.findOne({ _id: categoryId.trim(), restaurantId: req.tenantId });
                if (!category)
                    throw new AppError_1.NotFoundError('Category not found');
            }
            const updateData = {};
            if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
                updateData.categoryId = categoryId.trim();
            }
            if (name !== undefined && typeof name === 'string' && name.trim() !== '')
                updateData.name = name.trim();
            if (price !== undefined && !isNaN(Number(price)))
                updateData.price = Number(price);
            if (taxRate !== undefined && !isNaN(Number(taxRate)))
                updateData.taxRate = Number(taxRate);
            if (description !== undefined)
                updateData.description = description;
            if (isAvailable !== undefined)
                updateData.isAvailable = Boolean(isAvailable);
            if (image !== undefined)
                updateData.image = image;
            const dish = await dish_model_1.Dish.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId, isDeleted: false }, { $set: updateData }, { new: true, runValidators: true });
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
