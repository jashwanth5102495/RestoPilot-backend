import { Request, Response, NextFunction } from 'express';
import { Recipe } from './recipe.model';
import { Dish } from '../dishes/dish.model';
import { Ingredient } from '../ingredients/ingredient.model';

export class RecipeController {
  static async getRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const dishes = await Dish.find({ restaurantId: req.tenantId, isDeleted: false })
        .populate('categoryId')
        .lean();
      
      const recipes = await Recipe.find({ restaurantId: req.tenantId }).lean();
      const ingredients = await Ingredient.find({ restaurantId: req.tenantId, isDeleted: false }).lean();
      
      const ingredientMap = new Map(ingredients.map(i => [i._id.toString(), i]));
      const recipeMap = new Map(recipes.map(r => [r.dishId.toString(), r]));

      const result = dishes.map((dish: any) => {
        const recipe = recipeMap.get(dish._id.toString());
        
        let estCost = 0;
        if (recipe && recipe.items) {
          for (const item of recipe.items) {
            const ing = ingredientMap.get(item.ingredientId.toString());
            if (ing) {
              estCost += item.quantity * (ing.averageCost || 0);
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
            items: recipe.items || [],
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
    } catch (error) {
      next(error);
    }
  }

  static async updateRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { dishId, items } = req.body;
      if (!dishId || !items) {
        return res.status(400).json({ success: false, message: 'Dish ID and recipe items are required' });
      }

      let recipe = await Recipe.findOne({ restaurantId: req.tenantId, dishId });

      if (recipe) {
        recipe.items = items;
        await recipe.save();
      } else {
        recipe = new Recipe({
          restaurantId: req.tenantId,
          dishId,
          items
        });
        await recipe.save();
      }

      res.status(200).json({ success: true, data: recipe });
    } catch (error) {
      next(error);
    }
  }
}
