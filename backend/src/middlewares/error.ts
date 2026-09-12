import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/http';
import { logger } from '../utils/logger';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('request failed', err instanceof Error ? { message: err.message, stack: err.stack } : err);

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false, message: 'Validation failed', code: 'VALIDATION_ERROR', errors: err.issues,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false, message: err.message, code: err.code, errors: err.errors,
    });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A unique value already exists', code: 'CONFLICT', errors: [] });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND', errors: [] });
    }
    if (err.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'Transaction conflict. Please retry.', code: 'TRANSACTION_CONFLICT', errors: [] });
    }
  }
  return res.status(500).json({
    success: false, message: 'Internal server error', code: 'INTERNAL_ERROR', errors: [],
  });
};

export const notFound = (req: Request, res: Response) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, code: 'NOT_FOUND', errors: [] });
