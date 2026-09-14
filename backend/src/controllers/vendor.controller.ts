import { Request, Response } from 'express';
import * as service from '../services/vendor.service';

export const list = async (_req: Request, res: Response) => {
  const data = await service.listVendors();
  res.json({
    success: true,
    message: 'Vendors fetched successfully',
    data,
  });
};