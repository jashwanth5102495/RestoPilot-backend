"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ingredient_model_1 = require("../ingredients/ingredient.model");
const category_model_1 = require("../categories/category.model");
const dish_model_1 = require("../dishes/dish.model");
const recipe_model_1 = require("../recipes/recipe.model");
const inventory_transaction_model_1 = require("../inventory/inventory-transaction.model");
class SetupService {
    static async completeSetup(restaurantId, ingredients, dishes, userId) {
        // 0. Ensure collections exist before starting transaction (DDL not allowed inside transactions)
        try {
            await Promise.all([
                ingredient_model_1.Ingredient.createCollection(),
                inventory_transaction_model_1.InventoryTransaction.createCollection(),
                category_model_1.Category.createCollection(),
                dish_model_1.Dish.createCollection(),
                recipe_model_1.Recipe.createCollection()
            ]);
        }
        catch (err) {
            console.error('Failed to create collections:', err);
        }
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Create Ingredients and initial stock
            const ingredientMap = new Map(); // frontendId -> backend ObjectId string
            for (const ing of ingredients) {
                const newIng = new ingredient_model_1.Ingredient({
                    restaurantId,
                    name: ing.name,
                    unit: ing.unit,
                    currentStock: Number(ing.stock) || 0,
                    isActive: true
                });
                await newIng.save({ session });
                ingredientMap.set(ing.id, newIng._id.toString());
                if (Number(ing.stock) > 0) {
                    const tx = new inventory_transaction_model_1.InventoryTransaction({
                        restaurantId,
                        ingredientId: newIng._id,
                        type: inventory_transaction_model_1.TransactionType.OPENING_STOCK,
                        quantity: Number(ing.stock),
                        unit: ing.unit,
                        balanceAfter: Number(ing.stock),
                        notes: 'Initial setup stock',
                        createdBy: userId
                    });
                    await tx.save({ session });
                }
            }
            // 2. Create Default Category
            let mainCategory = await category_model_1.Category.findOne({ restaurantId, name: 'Main Course' }).session(session);
            if (!mainCategory) {
                mainCategory = new category_model_1.Category({
                    restaurantId,
                    name: 'Main Course',
                    description: 'Default category created during setup',
                    isActive: true
                });
                await mainCategory.save({ session });
            }
            // 3. Create Dishes and Recipes
            for (const dish of dishes) {
                const newDish = new dish_model_1.Dish({
                    restaurantId,
                    categoryId: mainCategory._id,
                    name: dish.name,
                    price: Number(dish.price),
                    isActive: true
                });
                await newDish.save({ session });
                if (dish.recipe && dish.recipe.length > 0) {
                    const recipeItems = dish.recipe.map((r) => {
                        const mappedIngId = ingredientMap.get(r.ingredientId);
                        if (!mappedIngId) {
                            throw new Error(`Ingredient with temp ID ${r.ingredientId} not found in mapped ingredients.`);
                        }
                        return {
                            ingredientId: new mongoose_1.default.Types.ObjectId(mappedIngId),
                            quantity: Number(r.quantity),
                            unit: r.unit || 'g'
                        };
                    });
                    const newRecipe = new recipe_model_1.Recipe({
                        restaurantId,
                        dishId: newDish._id,
                        items: recipeItems
                    });
                    await newRecipe.save({ session });
                }
            }
            await session.commitTransaction();
            session.endSession();
            return { success: true, message: 'Setup completed successfully' };
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Setup transaction failed:', error);
            throw error;
        }
    }
}
exports.SetupService = SetupService;
