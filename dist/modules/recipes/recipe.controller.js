"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeController = void 0;
const recipe_model_1 = require("./recipe.model");
const dish_model_1 = require("../dishes/dish.model");
const ingredient_model_1 = require("../ingredients/ingredient.model");
const recipe_template_model_1 = require("./recipe-template.model");
class RecipeController {
    static async getRecipes(req, res, next) {
        try {
            const dishes = await dish_model_1.Dish.find({ restaurantId: req.tenantId, isDeleted: false })
                .populate('categoryId')
                .lean();
            const recipes = await recipe_model_1.Recipe.find({ restaurantId: req.tenantId }).lean();
            const ingredients = await ingredient_model_1.Ingredient.find({ restaurantId: req.tenantId, isDeleted: false }).lean();
            const ingredientMap = new Map(ingredients.map(i => [i._id.toString(), i]));
            const recipeMap = new Map(recipes.map(r => [r.dishId.toString(), r]));
            const result = dishes.map((dish) => {
                const recipe = recipeMap.get(dish._id.toString());
                let estCost = 0;
                let populatedItems = [];
                if (recipe && recipe.items) {
                    for (const item of recipe.items) {
                        const ing = ingredientMap.get(item.ingredientId.toString());
                        if (ing) {
                            estCost += item.quantity * (ing.averageCost || 0);
                            populatedItems.push({
                                ...item,
                                ingredientName: ing.name
                            });
                        }
                        else {
                            populatedItems.push(item);
                        }
                    }
                }
                const margin = dish.price > 0 ? ((dish.price - estCost) / dish.price) * 100 : 0;
                return {
                    _id: dish._id,
                    name: dish.name,
                    price: dish.price,
                    categoryId: dish.categoryId,
                    recipe: recipe ? {
                        _id: recipe._id,
                        itemsCount: recipe.items?.length || 0,
                        items: populatedItems,
                        estCost,
                        margin: Math.max(0, Math.round(margin)),
                        status: 'Configured'
                    } : {
                        _id: null,
                        itemsCount: 0,
                        items: [],
                        estCost: 0,
                        margin: 0,
                        status: 'Missing'
                    }
                };
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateRecipe(req, res, next) {
        try {
            const { dishId, items } = req.body;
            if (!dishId || !items) {
                return res.status(400).json({ success: false, message: 'Dish ID and recipe items are required' });
            }
            let recipe = await recipe_model_1.Recipe.findOne({ restaurantId: req.tenantId, dishId });
            if (recipe) {
                recipe.items = items;
                await recipe.save();
            }
            else {
                recipe = new recipe_model_1.Recipe({
                    restaurantId: req.tenantId,
                    dishId,
                    items
                });
                await recipe.save();
            }
            res.status(200).json({ success: true, data: recipe });
        }
        catch (error) {
            next(error);
        }
    }
    static async matchTemplate(req, res, next) {
        try {
            const { name } = req.query;
            if (!name || typeof name !== 'string') {
                return res.status(400).json({ success: false, message: 'Dish name query parameter is required' });
            }
            const normalizedName = name.trim().toLowerCase().replace(/\s+/g, ' ');
            const template = await recipe_template_model_1.RecipeTemplate.findOne({
                isActive: true,
                $or: [
                    { normalizedDishName: normalizedName },
                    { aliases: normalizedName }
                ]
            }).lean();
            if (template) {
                return res.status(200).json({ success: true, data: template });
            }
            else {
                return res.status(404).json({ success: false, message: 'No standard recipe template found' });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecipeController = RecipeController;
