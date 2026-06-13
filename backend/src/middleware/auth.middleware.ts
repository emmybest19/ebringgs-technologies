import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthPayload, UserRole } from '../types';
import { AppError } from './error.middleware';

export const protect = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
