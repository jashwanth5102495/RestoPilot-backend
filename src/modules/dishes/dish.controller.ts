import { Request, Response, NextFunction } from 'express';
import { Dish } from './dish.model';
import { Category } from '../categories/category.model';
import { NotFoundError } from '../../shared/errors/AppError';

export class DishController {
  static async getDishes(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.query;
      const filter: any = { restaurantId: req.tenantId, isDeleted: false };
      
      if (categoryId) {
        filter.categoryId = categoryId;
      }

      const dishes = await Dish.find(filter).populate('categoryId', 'name').sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: dishes });
    } catch (error) {
      next(error);
    }
  }

  static async createDish(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure category belongs to the tenant
      const category = await Category.findOne({ _id: req.body.categoryId, restaurantId: req.tenantId });
      if (!category) throw new NotFoundError('Category not found');

      const dish = await Dish.create({
        ...req.body,
        restaurantId: req.tenantId,
      });
      res.status(201).json({ success: true, data: dish });
    } catch (error) {
      next(error);
    }
  }

  static async updateDish(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.categoryId) {
        const category = await Category.findOne({ _id: req.body.categoryId, restaurantId: req.tenantId });
        if (!category) throw new NotFoundError('Category not found');
      }

      const dish = await Dish.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId, isDeleted: false },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!dish) throw new NotFoundError('Dish not found');
      res.status(200).json({ success: true, data: dish });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDish(req: Request, res: Response, next: NextFunction) {
    try {
      const dish = await Dish.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!dish) throw new NotFoundError('Dish not found');
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}
