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
      const ingredient = await Ingredient.create({
        ...req.body,
        restaurantId: req.tenantId,
      });
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
