import { z } from 'zod';
import { paginationQuery, idParams } from './common';

const base = z.object({ body: z.unknown(), query: z.unknown(), params: z.unknown() });

export const createOrder = base.extend({
  body: z
    .object({
      items: z
        .array(
          z.object({
            productId: z.coerce.number().int().positive(),
            quantity: z.coerce.number().int().positive().max(100000),
          }),
        )
        .min(1)
        .max(100),
      couponCode: z.string().trim().max(50).optional(),
      paymentMethod: z.enum(['CARD', 'COD']).default('CARD'),
    })
    .superRefine((value, ctx) => {
      const ids = value.items.map((item) => item.productId);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: 'custom', message: 'Each product may appear only once in an order', path: ['items'] });
      }
    }),
  query: z.unknown(),
  params: z.unknown(),
});

export const orderList = base.extend({
  body: z.unknown(),
  query: paginationQuery
    .extend({
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
      search: z.string().trim().max(191).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      minAmount: z.coerce.number().min(0).optional(),
      maxAmount: z.coerce.number().min(0).optional(),
    })
    .refine((v) => v.minAmount === undefined || v.maxAmount === undefined || v.minAmount <= v.maxAmount, {
      message: 'minAmount cannot exceed maxAmount',
      path: ['minAmount'],
    }),
  params: z.unknown(),
});

export const idParam = base.extend({
  body: z.unknown(),
  query: z.unknown(),
  params: idParams,
});

export const statusUpdate = idParam.extend({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

export const salesReport = base.extend({
  body: z.unknown(),
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    vendorId: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    productId: z.coerce.number().int().positive().optional(),
    paymentStatus: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).optional(),
    groupBy: z.enum(['day', 'week', 'month', 'vendor', 'category', 'product']).default('month'),
  }),
  params: z.unknown(),
});