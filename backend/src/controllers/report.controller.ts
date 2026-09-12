import { Response } from 'express';

import { AuthRequest } from '../middlewares/auth';

import * as service from '../services/report.service';

export const sales = async (req: any, res: Response) => {
  const data = await service.sales(req.query);

  const serializedData = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );

  res.json({
    success: true,
    message: 'Sales report generated successfully',
    data: serializedData,
  });
};

export const vendor = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Vendor dashboard fetched successfully',
    data: await service.vendorDashboard(req.user!.id),
  });
};

export const admin = async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Admin dashboard fetched successfully',
    data: await service.adminDashboard(),
  });
};