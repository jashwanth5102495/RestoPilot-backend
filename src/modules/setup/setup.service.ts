import mongoose from 'mongoose';
import { Ingredient } from '../ingredients/ingredient.model';
import { Category } from '../categories/category.model';
import { Dish } from '../dishes/dish.model';
import { Recipe } from '../recipes/recipe.model';
import { InventoryTransaction, TransactionType } from '../inventory/inventory-transaction.model';

export class SetupService {
  static async completeSetup(restaurantId: string, ingredients: any[], dishes: any[], userId?: string) {
    // 0. Ensure collections exist before starting transaction (DDL not allowed inside transactions)
    try {
      await Promise.all([
        Ingredient.createCollection(),
        InventoryTransaction.createCollection(),
        Category.createCollection(),
        Dish.createCollection(),
        Recipe.createCollection()
      ]);
    } catch (err) {
      console.error('Failed to create collections:', err);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create Ingredients and initial stock
      const ingredientMap = new Map<string, string>(); // frontendId -> backend ObjectId string

      for (const ing of ingredients) {
        const newIng = new Ingredient({
          restaurantId,
          name: ing.name,
          unit: ing.unit,
          currentStock: Number(ing.stock) || 0,
          isActive: true
        });
        await newIng.save({ session });
        ingredientMap.set(ing.id, newIng._id.toString());

        if (Number(ing.stock) > 0) {
          const tx = new InventoryTransaction({
            restaurantId,
            ingredientId: newIng._id,
            type: TransactionType.OPENING_STOCK,
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
      let mainCategory = await Category.findOne({ restaurantId, name: 'Main Course' }).session(session);
      if (!mainCategory) {
        mainCategory = new Category({
          restaurantId,
          name: 'Main Course',
          description: 'Default category created during setup',
          isActive: true
        });
        await mainCategory.save({ session });
      }

      // 3. Create Dishes and Recipes
      for (const dish of dishes) {
        const newDish = new Dish({
          restaurantId,
          categoryId: mainCategory._id,
          name: dish.name,
          price: Number(dish.price),
          isActive: true
        });
        await newDish.save({ session });

        if (dish.recipe && dish.recipe.length > 0) {
          const recipeItems = dish.recipe.map((r: any) => {
            const mappedIngId = ingredientMap.get(r.ingredientId);
            if (!mappedIngId) {
              throw new Error(`Ingredient with temp ID ${r.ingredientId} not found in mapped ingredients.`);
            }
            return {
              ingredientId: new mongoose.Types.ObjectId(mappedIngId),
              quantity: Number(r.quantity),
              unit: r.unit || 'g'
            };
          });

          const newRecipe = new Recipe({
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

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Setup transaction failed:', error);
      throw error;
    }
  }
}
