import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as s from '../services/inventory.service';

export const update = async (req: AuthRequest, res: Response) => {
  const productId = Number(req.params.id);
  const availableQuantity = Number(req.body.availableQuantity);

  const data = await s.update(req.user!.id, req.user!.role, productId, availableQuantity);

  res.json({
    success: true,
    message: 'Inventory updated successfully',
    data,
  });
};