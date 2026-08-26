"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const user_model_1 = require("../modules/users/user.model");
const dish_model_1 = require("../modules/dishes/dish.model");
const ingredient_model_1 = require("../modules/ingredients/ingredient.model");
const recipe_template_model_1 = require("../modules/recipes/recipe-template.model");
const recipe_model_1 = require("../modules/recipes/recipe.model");
dotenv_1.default.config();
const run = async () => {
    try {
        await (0, database_1.connectDatabase)();
        console.log('Connected to DB');
        const email = 'mystery01@gmail.com';
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }
        const tenantId = user.restaurantId;
        console.log(`Found tenant via user: ${tenantId}`);
        const dishes = await dish_model_1.Dish.find({ restaurantId: tenantId, isDeleted: false });
        console.log(`Found ${dishes.length} dishes for this restaurant.`);
        let newIngredientsCount = 0;
        let recipesConfigured = 0;
        for (const dish of dishes) {
            const normalizedName = dish.name.trim().toLowerCase().replace(/\s+/g, ' ');
            let template = await recipe_template_model_1.RecipeTemplate.findOne({
                isActive: true,
                $or: [
                    { normalizedDishName: normalizedName },
                    { aliases: normalizedName }
                ]
            });
            if (!template) {
                const words = normalizedName.split(' ').filter(w => w.length > 2);
                if (words.length > 0) {
                    const regexPatterns = words.map(w => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
                    template = await recipe_template_model_1.RecipeTemplate.findOne({
                        isActive: true,
                        $or: [
                            { normalizedDishName: { $in: regexPatterns } },
                            { aliases: { $in: regexPatterns } }
                        ]
                    });
                }
            }
            if (!template) {
                console.log(`No template matched for dish: ${dish.name}`);
                continue;
            }
            console.log(`Matched '${dish.name}' to template '${template.dishName}'`);
            const recipeItems = [];
            for (const tIng of template.ingredients) {
                // Find or create ingredient in tenant's inventory
                let ingredient = await ingredient_model_1.Ingredient.findOne({
                    restaurantId: tenantId,
                    isDeleted: false,
                    name: { $regex: new RegExp(`^${tIng.name}$`, 'i') }
                });
                if (!ingredient) {
                    ingredient = new ingredient_model_1.Ingredient({
                        restaurantId: tenantId,
                        name: tIng.name,
                        unit: tIng.unit,
                        currentStock: 0,
                        minimumStockLevel: 10,
                        averageCost: 0,
                        category: 'General',
                        status: 'in_stock'
                    });
                    await ingredient.save();
                    newIngredientsCount++;
                    console.log(`  -> Created missing inventory ingredient: ${tIng.name}`);
                }
                recipeItems.push({
                    ingredientId: ingredient._id,
                    quantity: tIng.quantity,
                    unit: tIng.unit
                });
            }
            if (recipeItems.length > 0) {
                let recipe = await recipe_model_1.Recipe.findOne({ restaurantId: tenantId, dishId: dish._id });
                if (recipe) {
                    recipe.items = recipeItems;
                    await recipe.save();
                }
                else {
                    recipe = new recipe_model_1.Recipe({
                        restaurantId: tenantId,
                        dishId: dish._id,
                        items: recipeItems
                    });
                    await recipe.save();
                }
                recipesConfigured++;
                console.log(`  -> Configured recipe for ${dish.name}`);
            }
        }
        console.log(`\nDONE! Created ${newIngredientsCount} missing ingredients. Configured ${recipesConfigured} recipes.`);
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
