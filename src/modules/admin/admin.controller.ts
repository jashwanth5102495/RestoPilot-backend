import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../restaurants/restaurant.model';
import { Order } from '../orders/order.model';
import { Ingredient } from '../ingredients/ingredient.model';
import { DataRequest, DataRequestStatus } from './data-request.model';
import { Agent } from './agent.model';

export class AdminController {
  static async getRestaurants(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurants = await Restaurant.find().populate('ownerId', 'name email phone').lean();
      
      const statsPromises = restaurants.map(async (r) => {
        const totalOrders = await Order.countDocuments({ restaurantId: r._id });
        const orders = await Order.find({ restaurantId: r._id });
        const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const inventoryItems = await Ingredient.countDocuments({ restaurantId: r._id });

        return {
          ...r,
          stats: {
            totalOrders,
            totalSales,
            inventoryItems
          }
        };
      });

      const restaurantsWithStats = await Promise.all(statsPromises);

      res.status(200).json({
        success: true,
        data: restaurantsWithStats
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const { User } = await import('../users/user.model');
      
      const deletedRestaurant = await Restaurant.findByIdAndDelete(id);
      if (!deletedRestaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      await User.deleteMany({ restaurantId: id });
      await Restaurant.deleteMany({ parentRestaurantId: id });
      await Order.deleteMany({ restaurantId: id });
      await Ingredient.deleteMany({ restaurantId: id });
      
      const { Dish } = await import('../dishes/dish.model');
      await Dish.deleteMany({ restaurantId: id });

      const { Category } = await import('../categories/category.model');
      await Category.deleteMany({ restaurantId: id });

      res.status(200).json({ success: true, message: 'Restaurant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async exportBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });

      const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const orders = await Order.find({
        createdAt: { $gte: startDate, $lt: endDate }
      }).lean();

      res.setHeader('Content-disposition', `attachment; filename=backup-${month}-${year}.json`);
      res.setHeader('Content-type', 'application/json');
      res.send(JSON.stringify(orders, null, 2));
    } catch (error) {
      next(error);
    }
  }

  static async wipeBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });

      const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const result = await Order.deleteMany({
        createdAt: { $gte: startDate, $lt: endDate }
      });

      res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} orders.` });
    } catch (error) {
      next(error);
    }
  }

  static async getDataRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await DataRequest.find().populate('restaurantId', 'name email').sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  static async fulfillDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { dataUrl } = req.body;
      
      const request = await DataRequest.findById(id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      
      request.status = DataRequestStatus.FULFILLED;
      request.dataUrl = dataUrl;
      await request.save();
      
      res.status(200).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }

  static async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await Agent.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: agents });
    } catch (error) {
      next(error);
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and Code are required' });
      }

      // Check if code already exists
      const existing = await Agent.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Agent code already exists' });
      }

      const agent = new Agent({
        name,
        code: code.toUpperCase().trim(),
        status: 'ACTIVE'
      });
      await agent.save();

      res.status(201).json({ success: true, data: agent });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await Agent.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
      res.status(200).json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getTelegramStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { TelegramService } = await import('../notifications/telegram.service');
      const botInfo = await TelegramService.getBotInfo();
      
      res.status(200).json({
        success: true,
        data: {
          status: botInfo ? 'CONNECTED' : 'DISCONNECTED',
          botName: botInfo?.username
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveTelegramToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Telegram Bot Token is required' });
      }

      const { TelegramService } = await import('../notifications/telegram.service');
      const botInfo = await TelegramService.verifyToken(token);
      
      if (!botInfo) {
        return res.status(400).json({ success: false, message: 'Invalid Telegram Bot Token' });
      }

      const { SystemSettings } = await import('../settings/system-settings.model');
      await SystemSettings.findOneAndUpdate(
        { key: 'telegramBotToken' },
        { value: token },
        { upsert: true, new: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Telegram Bot Token saved successfully.',
        data: { botName: botInfo.username }
      });
    } catch (error) {
      next(error);
    }
  }
}
