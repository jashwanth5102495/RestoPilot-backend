"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderConsumptionService = void 0;
const mongoose_1 = require("mongoose");
const recipe_model_1 = require("../recipes/recipe.model");
const unit_converter_1 = require("../../shared/utils/unit-converter");
class OrderConsumptionService {
    /**
     * Calculates the total ingredients required for an order by aggregating recipes.
     * If a dish doesn't have a recipe, it's skipped.
     */
    static async calculateOrderConsumption(restaurantId, orderItems) {
        const dishIds = orderItems.map(i => i.dishId);
        // Fetch all recipes for the dishes in the order
        const recipes = await recipe_model_1.Recipe.find({
            restaurantId,
            dishId: { $in: dishIds }
        }).lean();
        const recipeMap = new Map(recipes.map(r => [r.dishId.toString(), r]));
        const consumptionMap = new Map();
        // Calculate consumption per dish
        for (const item of orderItems) {
            const recipe = recipeMap.get(item.dishId.toString());
            if (!recipe)
                continue; // No recipe configured for this dish
            for (const recipeItem of recipe.items) {
                // We know recipeItem.quantity is already in the ingredient's base unit logically
                // based on how we will save it. Wait, the prompt says recipe item has `quantity` and `unit`.
                // To be absolutely safe, we convert it to base unit just in case.
                const baseQty = unit_converter_1.UnitConverter.toBaseUnit(recipeItem.quantity, recipeItem.unit);
                const totalBaseQtyForOrderItem = baseQty * item.quantity;
                const ingIdStr = recipeItem.ingredientId.toString();
                const currentTotal = consumptionMap.get(ingIdStr) || 0;
                consumptionMap.set(ingIdStr, currentTotal + totalBaseQtyForOrderItem);
            }
        }
        return Array.from(consumptionMap.entries()).map(([id, qty]) => ({
            ingredientId: new mongoose_1.Types.ObjectId(id),
            quantityInBaseUnit: qty
        }));
    }
}
exports.OrderConsumptionService = OrderConsumptionService;
