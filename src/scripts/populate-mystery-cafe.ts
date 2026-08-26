import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import { Dish } from '../modules/dishes/dish.model';
import { Ingredient } from '../modules/ingredients/ingredient.model';
import { RecipeTemplate } from '../modules/recipes/recipe-template.model';
import { Recipe } from '../modules/recipes/recipe.model';

dotenv.config();

const run = async () => {
  try {
    await connectDatabase();
    console.log('Connected to DB');

    const email = 'mystery01@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const tenantId = user.restaurantId;
    console.log(`Found tenant via user: ${tenantId}`);

    const dishes = await Dish.find({ restaurantId: tenantId, isDeleted: false });
    console.log(`Found ${dishes.length} dishes for this restaurant.`);

    let newIngredientsCount = 0;
    let recipesConfigured = 0;

    for (const dish of dishes) {
      const normalizedName = dish.name.trim().toLowerCase().replace(/\s+/g, ' ');
      
      let template = await RecipeTemplate.findOne({
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
          template = await RecipeTemplate.findOne({
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
        let ingredient = await Ingredient.findOne({
          restaurantId: tenantId,
          isDeleted: false,
          name: { $regex: new RegExp(`^${tIng.name}$`, 'i') }
        });

        if (!ingredient) {
          ingredient = new Ingredient({
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
        let recipe = await Recipe.findOne({ restaurantId: tenantId, dishId: dish._id });
        if (recipe) {
          recipe.items = recipeItems;
          await recipe.save();
        } else {
          recipe = new Recipe({
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

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
