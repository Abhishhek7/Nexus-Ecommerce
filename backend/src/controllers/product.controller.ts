import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as service from '../services/product.service';

export const list = async (req: any, res: Response) =>
  res.json({ success: true, message: 'Products fetched successfully', data: await service.listProducts(req.query) });

export const details = async (req: any, res: Response) =>
  res.json({ success: true, message: 'Product fetched successfully', data: await service.getProduct(Number(req.params.id)) });

export const create = async (req: AuthRequest, res: Response) =>
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: await service.createProduct(req.user!.id, req.user!.role, req.body),
  });

export const update = async (req: AuthRequest, res: Response) =>
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: await service.updateProduct(req.user!.id, req.user!.role, Number(req.params.id), req.body),
  });

export const remove = async (req: AuthRequest, res: Response) => {
  await service.deleteProduct(req.user!.id, req.user!.role, Number(req.params.id));
  res.json({ success: true, message: 'Product deleted successfully', data: null });
};

export const topSelling = async (req: any, res: Response) =>
  res.json({
    success: true,
    message: 'Top selling products fetched successfully',
    data: await service.topSelling(req.query),
  });
