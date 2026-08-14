import { Request, Response, NextFunction } from 'express';
import { SetupService } from './setup.service';
import { AppError } from '../../shared/errors/AppError';

export class SetupController {
  static async completeSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingredients, dishes } = req.body;
      const restaurantId = req.user?.restaurantId;
      const userId = req.user?.userId;

      if (!restaurantId) {
        throw new AppError('Restaurant ID not found in user context', 400);
      }

      if (!ingredients || !dishes) {
        throw new AppError('Ingredients and dishes are required', 400);
      }

      const result = await SetupService.completeSetup(restaurantId.toString(), ingredients, dishes, userId?.toString());

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}
