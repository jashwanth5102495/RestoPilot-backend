import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Category } from './category.model';
import { Dish } from '../dishes/dish.model';
import { NotFoundError } from '../../shared/errors/AppError';

export class CategoryController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: any = { restaurantId: req.tenantId };
      if (req.query.activeOnly === 'true') {
        filter.isActive = { $ne: false };
      }

      let categories = await Category.find(filter).sort({ displayOrder: 1, createdAt: -1 });
      
      if (categories.length === 0 && !req.query.activeOnly) {
        const defaultCategories = [
          'Starters',
          'Main Course',
          'Rice & Biryani',
          'Breads',
          'South Indian',
          'Desserts',
          'Beverages',
          'Combos & Thalis'
        ];

        const seededCategories = [];
        for (let i = 0; i < defaultCategories.length; i++) {
          const cat = new Category({
            restaurantId: req.tenantId,
            name: defaultCategories[i],
            description: `Default category: ${defaultCategories[i]}`,
            displayOrder: i + 1,
            isActive: true
          });
          await cat.save();
          seededCategories.push(cat);
        }
        categories = seededCategories;
      }

      // Compute dish counts per category
      const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId as string);
      const dishCounts = await Dish.aggregate([
        { $match: { restaurantId: tenantObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
      ]);
      const countMap: Record<string, number> = {};
      dishCounts.forEach((d: any) => {
        if (d._id) countMap[d._id.toString()] = d.count;
      });

      const categoriesWithCount = categories.map((cat: any) => {
        const obj = cat.toObject ? cat.toObject() : cat;
        return {
          ...obj,
          dishCount: countMap[cat._id.toString()] || 0
        };
      });

      res.status(200).json({ success: true, data: categoriesWithCount });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.create({
        ...req.body,
        restaurantId: req.tenantId,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      });

      try {
        const { emitToTenant } = await import('../../shared/utils/socket');
        const tid = req.tenantId ? req.tenantId.toString() : '';
        if (tid) {
          emitToTenant(tid, 'category_created', { category });
          emitToTenant(tid, 'menu_updated', { categoryId: category._id });
        }
      } catch (sockErr) {
        console.error('Socket emit error on category create:', sockErr);
      }

      res.status(201).json({ success: true, data: { ...category.toObject(), dishCount: 0 } });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, restaurantId: req.tenantId },
        { $set: req.body },
        { returnDocument: 'after', runValidators: true }
      );
      if (!category) throw new NotFoundError('Category not found');

      try {
        const { emitToTenant } = await import('../../shared/utils/socket');
        const tid = req.tenantId ? req.tenantId.toString() : '';
        if (tid) {
          emitToTenant(tid, 'category_updated', { category });
          emitToTenant(tid, 'menu_updated', { categoryId: category._id });
        }
      } catch (sockErr) {
        console.error('Socket emit error on category update:', sockErr);
      }

      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async toggleCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.findOne({ _id: req.params.id, restaurantId: req.tenantId });
      if (!category) throw new NotFoundError('Category not found');

      const newStatus = typeof req.body.isActive === 'boolean' ? req.body.isActive : !category.isActive;
      category.isActive = newStatus;
      await category.save();

      try {
        const { emitToTenant } = await import('../../shared/utils/socket');
        const tid = req.tenantId ? req.tenantId.toString() : '';
        if (tid) {
          emitToTenant(tid, 'category_updated', { category });
          emitToTenant(tid, 'menu_updated', { categoryId: category._id, isActive: category.isActive });
        }
      } catch (sockErr) {
        console.error('Socket emit error on category toggle:', sockErr);
      }

      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.findOneAndDelete({ _id: req.params.id, restaurantId: req.tenantId });
      if (!category) throw new NotFoundError('Category not found');

      try {
        const { emitToTenant } = await import('../../shared/utils/socket');
        const tid = req.tenantId ? req.tenantId.toString() : '';
        if (tid) {
          emitToTenant(tid, 'category_deleted', { categoryId: req.params.id });
          emitToTenant(tid, 'menu_updated', { categoryId: req.params.id });
        }
      } catch (sockErr) {
        console.error('Socket emit error on category delete:', sockErr);
      }

      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}
