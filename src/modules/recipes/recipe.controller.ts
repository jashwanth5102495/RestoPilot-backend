import { Request, Response, NextFunction } from 'express';
import { Recipe } from './recipe.model';
import { Dish } from '../dishes/dish.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { RecipeTemplate } from './recipe-template.model';

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
        let populatedItems: any[] = [];
        if (recipe && recipe.items) {
          for (const item of recipe.items) {
            const ing = ingredientMap.get(item.ingredientId.toString());
            if (ing) {
              estCost += item.quantity * (ing.averageCost || 0);
              populatedItems.push({
                ...item,
                ingredientName: ing.name
              });
            } else {
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

  static async matchTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Dish name query parameter is required' });
      }

      const normalizedName = name.trim().toLowerCase().replace(/\s+/g, ' ');
      
      let template = await RecipeTemplate.findOne({
        isActive: true,
        $or: [
          { normalizedDishName: normalizedName },
          { aliases: normalizedName }
        ]
      }).lean();

      // Fallback to fuzzy search if no exact match
      if (!template) {
        const words = normalizedName.split(' ').filter(w => w.length > 2);
        if (words.length > 0) {
          const regexPatterns = words.map(w => new RegExp(w, 'i'));
          template = await RecipeTemplate.findOne({
            isActive: true,
            $or: [
              { normalizedDishName: { $in: regexPatterns } },
              { aliases: { $in: regexPatterns } }
            ]
          }).lean();
        }
      }

      if (template) {
        return res.status(200).json({ success: true, data: template });
      } else {
        return res.status(404).json({ success: false, message: 'No standard recipe template found' });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getAllTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await RecipeTemplate.find({ isActive: true })
        .select('_id dishName category')
        .sort({ category: 1, dishName: 1 })
        .lean();
      return res.status(200).json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }
}
