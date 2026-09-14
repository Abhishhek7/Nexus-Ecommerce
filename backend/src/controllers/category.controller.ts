import { Request, Response } from 'express';
import * as s from '../services/category.service';

export const list = async (_req: Request, res: Response) => {
  const data = await s.list();
  res.json({
    success: true,
    message: 'Category hierarchy fetched successfully',
    data,
  });
};

export const create = async (req: Request, res: Response) => {
  const data = await s.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data,
  });
};

export const update = async (req: Request, res: Response) => {
  const data = await s.update(Number(req.params.id), req.body);
  res.json({
    success: true,
    message: 'Category updated successfully',
    data,
  });
};

export const remove = async (req: Request, res: Response) => {
  const data = await s.remove(Number(req.params.id));
  res.json({
    success: true,
    message: 'Category deleted successfully',
    data,
  });
};