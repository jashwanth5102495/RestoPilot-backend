import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import { UserRole } from '../modules/users/user.model';

import * as Sentry from '@sentry/node';

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  if (!reqAny.user) {
    return next(new UnauthorizedError('Not authenticated'));
  }

  if (!reqAny.user.restaurantId && reqAny.user.userId) {
    try {
      const { User } = await import('../modules/users/user.model');
      const dbUser = await User.findById(reqAny.user.userId).lean();
      if (dbUser?.restaurantId) {
        reqAny.user.restaurantId = dbUser.restaurantId.toString();
      } else {
        const { Restaurant } = await import('../modules/restaurants/restaurant.model');
        const dbRest = await Restaurant.findOne({ ownerId: reqAny.user.userId }).lean();
        if (dbRest) {
          reqAny.user.restaurantId = dbRest._id.toString();
        }
      }
    } catch (err) {
      console.error('Failed to resolve restaurant context in requireTenant:', err);
    }
  }

  if (reqAny.user.role !== UserRole.SUPER_ADMIN && !reqAny.user.restaurantId) {
    return next(new ForbiddenError('User does not belong to a restaurant'));
  }

  if (reqAny.user.restaurantId) {
    reqAny.tenantId = reqAny.user.restaurantId;
    Sentry.setTag('tenantId', reqAny.tenantId);
  }

  next();
};
