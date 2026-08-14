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
            const ingredient = await ingredient_model_1.Ingredient.create({
                ...req.body,
                restaurantId: req.tenantId,
            });
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
