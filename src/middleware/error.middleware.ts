import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';
import * as Sentry from '@sentry/node';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'ERROR';
    if (err instanceof ValidationError) {
      details = err.details;
    }
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    code = 'DUPLICATE_KEY';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Mongoose validation error';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Sentry and Logging logic
  if (statusCode >= 500) {
    // Only capture unexpected 5xx errors to Sentry
    Sentry.withScope(scope => {
      scope.setExtra('reqId', req.id);
      
      if (req.user) {
        scope.setUser({ id: req.user.userId, role: req.user.role });
        if (req.user.restaurantId) {
          scope.setTag('restaurantId', req.user.restaurantId);
        }
      }
      
      if (req.tenantId) {
        scope.setTag('tenantId', req.tenantId);
      }
      
      Sentry.captureException(err);
    });

    logger.error({
      msg: 'Unhandled Exception',
      err,
      statusCode,
      requestId: req.id,
      userId: req.user?.userId,
      restaurantId: req.user?.restaurantId || req.tenantId,
    });
  } else {
    logger.warn({
      msg: 'Client Error',
      errorMessage: err.message,
      statusCode,
      code,
      requestId: req.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details: details.length > 0 ? details : undefined,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
      requestId: req.id,
    },
  });
};
