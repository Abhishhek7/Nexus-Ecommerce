import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/http';

export interface AuthRequest extends Request {
  user?: { id: number; role: Role };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: number; role: Role };
    req.user = { id: Number(payload.id), role: payload.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
};

export const authorize = (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
  }
  next();
};