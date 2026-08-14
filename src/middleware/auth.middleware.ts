import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../shared/errors/AppError';
import { env } from '../config/env';
import { UserRole } from '../modules/users/user.model';

interface JwtPayload {
  userId: string;
  restaurantId?: string;
  role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
