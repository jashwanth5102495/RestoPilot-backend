import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import { UserRole } from '../modules/users/user.model';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqAny = req as any;
    if (!reqAny.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(reqAny.user.role as UserRole)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};
