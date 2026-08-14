import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';

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

  // Log error (hide stack in production unless operational)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${err.message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details: details.length ? details : undefined,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    },
  });
};
