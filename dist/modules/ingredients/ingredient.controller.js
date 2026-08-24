"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientController = void 0;
const ingredient_model_1 = require("./ingredient.model");
const AppError_1 = require("../../shared/errors/AppError");
class IngredientController {
    static async getIngredients(req, res, next) {
        try {
            const ingredients = await ingredient_model_1.Ingredient.find({ restaurantId: req.tenantId, isDeleted: false }).sort({ name: 1 });
            res.status(200).json({ success: true, data: ingredients });
        }
        catch (error) {
            next(error);
        }
    }
    static async createIngredient(req, res, next) {
        try {
            let { name, currentStock, unit, minimumStock, averageCost } = req.body;
            if (name)
                name = name.trim();
            // Look for an existing active ingredient with the exact same name (case-insensitive if needed, but exact is fine for the index)
            let ingredient = await ingredient_model_1.Ingredient.findOne({
                restaurantId: req.tenantId,
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                isDeleted: false
            });
            if (ingredient) {
                // Add to existing stock instead of crashing
                ingredient.currentStock += (Number(currentStock) || 0);
                if (unit)
                    ingredient.unit = unit;
                if (minimumStock !== undefined)
                    ingredient.minimumStock = minimumStock;
                if (averageCost !== undefined)
                    ingredient.averageCost = averageCost;
                await ingredient.save();
            }
            else {
                ingredient = await ingredient_model_1.Ingredient.create({
                    ...req.body,
                    name,
                    restaurantId: req.tenantId,
                });
            }
            res.status(201).json({ success: true, data: ingredient });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateIngredient(req, res, next) {
        try {
            const ingredient = await ingredient_model_1.Ingredient.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId, isDeleted: false }, { $set: req.body }, { new: true, runValidators: true });
            if (!ingredient)
                throw new AppError_1.NotFoundError('Ingredient not found');
            res.status(200).json({ success: true, data: ingredient });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteIngredient(req, res, next) {
        try {
            const ingredient = await ingredient_model_1.Ingredient.findOneAndUpdate({ _id: req.params.id, restaurantId: req.tenantId, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
            if (!ingredient)
                throw new AppError_1.NotFoundError('Ingredient not found');
            res.status(200).json({ success: true, data: {} });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.IngredientController = IngredientController;
