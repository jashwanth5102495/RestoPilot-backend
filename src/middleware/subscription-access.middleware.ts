import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../modules/restaurants/restaurant.model';
import { PublicController } from '../modules/public/public.controller';
import { SubscriptionService } from '../modules/subscription/services/subscription.service';
import { ForbiddenError } from '../shared/errors/AppError';

export const requireSubscriptionAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.tenantId || req.user?.restaurantId;
    if (!restaurantId) return next(new ForbiddenError('Restaurant context is missing'));

    const access = await SubscriptionService.getAccess(restaurantId);
    if (!access.active) {
      const error = new ForbiddenError('Active subscription required to use this feature');
      error.statusCode = 402;
      error.code = 'SUBSCRIPTION_REQUIRED';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePublicSubscriptionAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug || req.params.restaurantSlug;
    const restaurant = await Restaurant.findOne(PublicController.getRestaurantSlugFilter(slug, 'onlineSlug')).select('_id');
    if (!restaurant) return next(new ForbiddenError('Restaurant not found'));

    const access = await SubscriptionService.getAccess(restaurant._id);
    if (!access.active) {
      const error = new ForbiddenError('Restaurant subscription is inactive');
      error.statusCode = 402;
      error.code = 'SUBSCRIPTION_REQUIRED';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};
