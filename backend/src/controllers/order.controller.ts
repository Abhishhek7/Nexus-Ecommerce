import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as service from '../services/order.service';

export const create = async (req: AuthRequest, res: Response) => {
  const data = await service.createOrder(req.user!.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data,
  });
};

export const list = async (req: AuthRequest, res: Response) => {
  const data = await service.listOrders(req.user!, req.query as any);
  res.json({
    success: true,
    message: 'Orders fetched successfully',
    data,
  });
};

export const details = async (req: AuthRequest, res: Response) => {
  const orderId = Number(req.params.id);
  const data = await service.getOrder(req.user!, orderId);
  res.json({
    success: true,
    message: 'Order fetched successfully',
    data,
  });
};

export const status = async (req: AuthRequest, res: Response) => {
  const orderId = Number(req.params.id);
  const data = await service.updateStatus(req.user!, orderId, req.body.status);
  res.json({
    success: true,
    message: 'Order status updated successfully',
    data,
  });
};

export const cancel = async (req: AuthRequest, res: Response) => {
  const orderId = Number(req.params.id);
  const data = await service.cancelOrder(req.user!, orderId);
  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data,
  });
};