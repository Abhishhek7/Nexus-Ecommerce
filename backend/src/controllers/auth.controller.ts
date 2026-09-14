import { Request, Response } from 'express';
import * as s from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const data = await s.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data,
  });
};

export const login = async (req: Request, res: Response) => {
  const data = await s.login(req.body);
  res.json({
    success: true,
    message: 'Login successful',
    data,
  });
};