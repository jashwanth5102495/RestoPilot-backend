import { Request, Response, NextFunction } from 'express';
import { Ingredient } from './ingredient.model';
import { NotFoundError } from '../../shared/errors/AppError';

export class IngredientController {
  static async getIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const ingredients = await Ingredient.find({ restaurantId: req.tenantId, isDeleted: false }).sort({ name: 1 });
      res.status(200).json({ success: true, data: ingredients });
    } catch (error) {
      next(error);
    }
  }

  static async createIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      let { name, currentStock, unit, minimumStock, averageCost } = req.body;
      if (name) name = name.trim();
      
      // Look for an existing active ingredient with the exact same name (case-insensitive if needed, but exact is fine for the index)
      let ingredient = await Ingredient.findOne({ 
        restaurantId: req.tenantId, 
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        isDeleted: false 
      });

      if (ingredient) {
        // Add to existing stock instead of crashing
        ingredient.currentStock += (Number(currentStock) || 0);
        if (unit) ingredient.unit = unit;
        if (minimumStock !== undefined) ingredient.minimumStock = minimumStock;
        if (averageCost !== undefined) ingredient.averageCost = averageCost;
        await ingredient.save();
      } else {
        ingredient = await Ingredient.create({
          ...req.body,
          name,
          restaurantId: req.tenantId,
        });
      }

      res.status(201).json({ success: true, data: ingredient });
    } catch (error) {
      next(error);
    }
  }

  static async updateIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const ingredient = await Ingredient.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId, isDeleted: false },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!ingredient) throw new NotFoundError('Ingredient not found');
      res.status(200).json({ success: true, data: ingredient });
    } catch (error) {
      next(error);
    }
  }

  static async deleteIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const ingredient = await Ingredient.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!ingredient) throw new NotFoundError('Ingredient not found');
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}
