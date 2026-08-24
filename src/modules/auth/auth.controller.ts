import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async waiterLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantCode, loginId, pin } = req.body;
      const result = await AuthService.waiterLogin(restaurantCode, loginId, pin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async registerRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerRestaurant(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Restaurant registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      let restaurantData = null;
      if ((req as any).user?.restaurantId) {
        const { Restaurant } = await import('../restaurants/restaurant.model');
        restaurantData = await Restaurant.findById((req as any).user.restaurantId).lean();
      }

      res.status(200).json({
        success: true,
        data: {
          user: { ...(req as any).user, restaurant: restaurantData }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async switchBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.body;
      const userId = (req as any).user?.userId;
      const currentRestaurantId = (req as any).user?.restaurantId;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required' });
      }

      const result = await AuthService.switchBranch(userId, currentRestaurantId, branchId);

      res.status(200).json({
        success: true,
        message: 'Switched restaurant context successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
