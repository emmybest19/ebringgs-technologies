import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Mongoose duplicate key
  if ('code' in err && (err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({ status: 'error', message: 'Duplicate value for a unique field.' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
