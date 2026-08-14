import { Request, Response, NextFunction } from 'express';
import { Category } from './category.model';
import { NotFoundError } from '../../shared/errors/AppError';

export class CategoryController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await Category.find({ restaurantId: req.tenantId }).sort({ displayOrder: 1, createdAt: -1 });
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.create({
        ...req.body,
        restaurantId: req.tenantId,
      });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!category) throw new NotFoundError('Category not found');
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.findOneAndDelete({ _id: req.params.id, restaurantId: req.tenantId });
      if (!category) throw new NotFoundError('Category not found');
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}
