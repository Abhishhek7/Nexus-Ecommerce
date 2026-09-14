import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.email(),
    password: z.string().min(8),
    role: z.enum(['CUSTOMER', 'VENDOR']).default('CUSTOMER'),
  }),
  query: z.any(),
  params: z.any(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
  query: z.any(),
  params: z.any(),
});