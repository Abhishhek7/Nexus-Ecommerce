import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as service from '../services/product.service';

export const list = async (req: Request, res: Response) => {
  const data = await service.listProducts(req.query as any);
  res.json({
    success: true,
    message: 'Products fetched successfully',
    data,
  });
};

export const details = async (req: Request, res: Response) => {
  const productId = Number(req.params.id);
  const data = await service.getProduct(productId);
  res.json({
    success: true,
    message: 'Product fetched successfully',
    data,
  });
};

export const create = async (req: AuthRequest, res: Response) => {
  const data = await service.createProduct(req.user!.id, req.user!.role, req.body);
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data,
  });
};

export const update = async (req: AuthRequest, res: Response) => {
  const productId = Number(req.params.id);
  const data = await service.updateProduct(req.user!.id, req.user!.role, productId, req.body);
  res.json({
    success: true,
    message: 'Product updated successfully',
    data,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const productId = Number(req.params.id);
  await service.deleteProduct(req.user!.id, req.user!.role, productId);
  res.json({
    success: true,
    message: 'Product deleted successfully',
    data: null,
  });
};

export const topSelling = async (req: Request, res: Response) => {
  const data = await service.topSelling(req.query as any);
  res.json({
    success: true,
    message: 'Top selling products fetched successfully',
    data,
  });
};