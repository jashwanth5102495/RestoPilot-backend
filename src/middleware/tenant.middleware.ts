import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import { UserRole } from '../modules/users/user.model';

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Not authenticated'));
  }

  // Super admins are not strictly bound to one tenant for their own operations,
  // but if they operate on a specific tenant, it should be specified (e.g. via params or body).
  // For normal users, they MUST have a restaurantId in their token.
  if (req.user.role !== UserRole.SUPER_ADMIN && !req.user.restaurantId) {
    return next(new ForbiddenError('User does not belong to a restaurant'));
  }

  if (req.user.restaurantId) {
    req.tenantId = req.user.restaurantId;
  }

  next();
};
