import { Request, Response, NextFunction } from 'express';
import { Dish } from './dish.model';
import { Category } from '../categories/category.model';
import { NotFoundError } from '../../shared/errors/AppError';

export class DishController {
  static async getDishes(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.query;
      const filter: any = { restaurantId: req.tenantId, isDeleted: { $ne: true } };
      
      if (categoryId) {
        filter.categoryId = categoryId;
      }

      const dishes = await Dish.find(filter).populate('categoryId', 'name').sort({ displayOrder: 1, createdAt: -1 }).lean();
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
      let { categoryId, name, price, taxRate, description, isAvailable, image } = req.body;

      if (typeof categoryId === 'object' && categoryId?._id) {
        categoryId = categoryId._id;
      }

      if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
        const category = await Category.findOne({ _id: categoryId.trim(), restaurantId: req.tenantId });
        if (!category) throw new NotFoundError('Category not found');
      }

      const updateData: any = {};
      if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
        updateData.categoryId = categoryId.trim();
      }
      if (name !== undefined && typeof name === 'string' && name.trim() !== '') {
        const existingDish = await Dish.findOne({ restaurantId: req.tenantId, name: name.trim(), _id: { $ne: req.params.id }, isDeleted: false });
        if (existingDish) {
          return res.status(400).json({ success: false, message: 'A dish with this name already exists' });
        }
        updateData.name = name.trim();
      }
      if (price !== undefined && !isNaN(Number(price))) updateData.price = Number(price);
      if (taxRate !== undefined && !isNaN(Number(taxRate))) updateData.taxRate = Number(taxRate);
      if (description !== undefined) updateData.description = description;
      if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
      if (image !== undefined) updateData.image = image;

      const dish = await Dish.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId, isDeleted: false },
        { $set: updateData },
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
