import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import { UserRole } from '../modules/users/user.model';

import * as Sentry from '@sentry/node';

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  if (!reqAny.user) {
    return next(new UnauthorizedError('Not authenticated'));
  }

  // Super admins are not strictly bound to one tenant for their own operations,
  // but if they operate on a specific tenant, it should be specified (e.g. via params or body).
  // For normal users, they MUST have a restaurantId in their token.
  if (reqAny.user.role !== UserRole.SUPER_ADMIN && !reqAny.user.restaurantId) {
    return next(new ForbiddenError('User does not belong to a restaurant'));
  }

  if (reqAny.user.restaurantId) {
    reqAny.tenantId = reqAny.user.restaurantId;
    Sentry.setTag('tenantId', reqAny.tenantId);
  }

  next();
};
