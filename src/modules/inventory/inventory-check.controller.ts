import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { Ingredient } from '../ingredients/ingredient.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { PhysicalStockCheck } from './physical-stock-check.model';
import { AppError } from '../../shared/errors/AppError';

export class InventoryCheckController {
  
  static async getCheckStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurant = await Restaurant.findById(req.tenantId);
      if (!restaurant) throw new AppError('Restaurant not found', 404);

      const frequency = restaurant.inventoryCheckFrequency || 'WEEKLY';
      
      // Determine cutoff date for "Due" items
      const now = new Date();
      const cutoff = new Date();
      if (frequency === 'DAILY') cutoff.setDate(now.getDate() - 1);
      else if (frequency === 'WEEKLY') cutoff.setDate(now.getDate() - 7);
      else if (frequency === 'BIWEEKLY') cutoff.setDate(now.getDate() - 14);
      else if (frequency === 'MONTHLY') cutoff.setMonth(now.getMonth() - 1);

      // Find ingredients
      const ingredients = await Ingredient.find({ restaurantId: req.tenantId, isDeleted: false }).lean();
      
      let dueCount = 0;
      let overdueCount = 0;
      let recentlyCheckedCount = 0;
      
      const prioritizedItems = [];

      for (const ing of ingredients) {
        const isLowStock = ing.currentStock <= ing.minimumStock;
        const lastChecked = ing.lastCheckedAt;
        
        let status = 'RECENTLY_CHECKED';
        
        if (!lastChecked) {
          status = 'OVERDUE';
          overdueCount++;
        } else if (lastChecked < cutoff) {
          // If it's more than 2x the frequency past, consider it overdue
          const overdueCutoff = new Date(cutoff);
          const diff = now.getTime() - cutoff.getTime();
          overdueCutoff.setTime(cutoff.getTime() - diff);
          
          if (lastChecked < overdueCutoff) {
            status = 'OVERDUE';
            overdueCount++;
          } else {
            status = 'DUE';
            dueCount++;
          }
        } else {
          recentlyCheckedCount++;
        }

        // Prioritization scoring
        let priorityScore = 0;
        if (status === 'OVERDUE') priorityScore += 100;
        if (status === 'DUE') priorityScore += 50;
        if (isLowStock) priorityScore += 30;
        if (!lastChecked) priorityScore += 20;

        prioritizedItems.push({
          ...ing,
          checkStatus: status,
          priorityScore
        });
      }

      // Sort by priority descending
      prioritizedItems.sort((a, b) => b.priorityScore - a.priorityScore);

      const isSnoozed = restaurant.inventoryCheckSnoozedUntil && new Date(restaurant.inventoryCheckSnoozedUntil) > now;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            due: dueCount,
            overdue: overdueCount,
            recentlyChecked: recentlyCheckedCount,
            total: ingredients.length
          },
          items: prioritizedItems,
          snoozedUntil: isSnoozed ? restaurant.inventoryCheckSnoozedUntil : null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitChecks(req: Request, res: Response, next: NextFunction) {
    try {
      const { checks } = req.body;
      if (!Array.isArray(checks) || checks.length === 0) {
        return res.status(400).json({ success: false, message: 'Checks array is required' });
      }

      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError('Tenant ID is required', 400);

      const userId = req.user?.userId;
      if (!userId) throw new AppError('User ID is required', 401);

      const results = await InventoryService.submitPhysicalChecks(tenantId, userId, checks);
      
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  static async snoozeReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { snoozeHours } = req.body;
      const hours = parseInt(snoozeHours, 10) || 24;
      
      const until = new Date();
      until.setHours(until.getHours() + hours);

      await Restaurant.findByIdAndUpdate(req.tenantId, {
        inventoryCheckSnoozedUntil: until
      });

      res.status(200).json({ success: true, data: { snoozedUntil: until } });
    } catch (error) {
      next(error);
    }
  }

  static async getCheckHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, ingredientId } = req.query;
      const query: any = { restaurantId: req.tenantId };
      if (ingredientId) query.ingredientId = ingredientId;

      const skip = (Number(page) - 1) * Number(limit);

      const checks = await PhysicalStockCheck.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name')
        .lean();

      const total = await PhysicalStockCheck.countDocuments(query);

      res.status(200).json({
        success: true,
        data: checks,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
