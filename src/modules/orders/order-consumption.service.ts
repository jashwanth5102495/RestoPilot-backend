import { Types } from 'mongoose';
import { Recipe, IRecipeItem } from '../recipes/recipe.model';
import { IOrderItem } from '../orders/order.model';
import { UnitConverter } from '../../shared/utils/unit-converter';

export interface RequiredIngredient {
  ingredientId: Types.ObjectId;
  quantityInBaseUnit: number;
}

export class OrderConsumptionService {
  /**
   * Calculates the total ingredients required for an order by aggregating recipes.
   * If a dish doesn't have a recipe, it's skipped.
   */
  static async calculateOrderConsumption(
    restaurantId: string | Types.ObjectId,
    orderItems: IOrderItem[]
  ): Promise<RequiredIngredient[]> {
    
    const dishIds = orderItems.map(i => i.dishId);
    
    // Fetch all recipes for the dishes in the order
    const recipes = await Recipe.find({
      restaurantId,
      dishId: { $in: dishIds }
    }).lean();

    const recipeMap = new Map(recipes.map(r => [r.dishId.toString(), r]));
    const consumptionMap = new Map<string, number>();

    // Calculate consumption per dish
    for (const item of orderItems) {
      const recipe = recipeMap.get(item.dishId.toString());
      if (!recipe || !recipe.items || recipe.items.length === 0) {
        continue;
      }
      
      for (const recipeItem of recipe.items) {
        // We know recipeItem.quantity is already in the ingredient's base unit logically
        // based on how we will save it. Wait, the prompt says recipe item has `quantity` and `unit`.
        // To be absolutely safe, we convert it to base unit just in case.
        const baseQty = UnitConverter.toBaseUnit(recipeItem.quantity, recipeItem.unit);
        const totalBaseQtyForOrderItem = baseQty * item.quantity;
        
        const ingIdStr = recipeItem.ingredientId.toString();
        const currentTotal = consumptionMap.get(ingIdStr) || 0;
        
        consumptionMap.set(ingIdStr, currentTotal + totalBaseQtyForOrderItem);
      }
    }

    return Array.from(consumptionMap.entries()).map(([id, qty]) => ({
      ingredientId: new Types.ObjectId(id),
      quantityInBaseUnit: qty
    }));
  }
}
