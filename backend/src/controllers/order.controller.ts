import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as service from '../services/order.service';

export const create = async (req: AuthRequest, res: Response) =>
  res.status(201).json({ success: true, message: 'Order created successfully', data: await service.createOrder(req.user!.id, req.body) });

export const list = async (req: AuthRequest, res: Response) =>
  res.json({ success: true, message: 'Orders fetched successfully', data: await service.listOrders(req.user!, req.query as any) });

export const details = async (req: AuthRequest, res: Response) =>
  res.json({ success: true, message: 'Order fetched successfully', data: await service.getOrder(req.user!, Number(req.params.id)) });

export const status = async (req: AuthRequest, res: Response) =>
  res.json({ success: true, message: 'Order status updated successfully', data: await service.updateStatus(req.user!, Number(req.params.id), req.body.status) });

export const cancel = async (req: AuthRequest, res: Response) =>
  res.json({ success: true, message: 'Order cancelled successfully', data: await service.cancelOrder(req.user!, Number(req.params.id)) });
