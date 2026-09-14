import { z } from 'zod';
import { paginationQuery, idParams } from './common';

const base = z.object({ body: z.unknown(), query: z.unknown(), params: z.unknown() });
const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.coerce.number().int().positive().optional(),
);
const optionalPrice = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional(),
);
const optionalBoolean = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.coerce.boolean().optional(),
);

export const productCreate = base.extend({
  body: z.object({
    vendorId: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2).max(191),
    sku: z.string().trim().min(2).max(191),
    description: z.string().trim().max(10000).default(''),
    price: z.coerce.number().positive(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
    initialQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  }),
  query: z.unknown(),
  params: z.unknown(),
});

export const productUpdate = base.extend({
  body: z
    .object({
      vendorId: optionalNumber,
      categoryId: optionalNumber,
      name: z.string().trim().min(2).max(191).optional(),
      description: z.string().trim().max(10000).optional(),
      price: z.coerce.number().positive().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
  query: z.unknown(),
  params: idParams,
});

export const productList = base.extend({
  body: z.unknown(),
  query: paginationQuery
    .extend({
      search: z.string().trim().max(191).optional(),
      vendorId: optionalNumber,
      categoryId: optionalNumber,
      categoryTree: z.coerce.boolean().default(false),
      minPrice: optionalPrice,
      maxPrice: optionalPrice,
      status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
      inStock: optionalBoolean,
      sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
      message: 'minPrice cannot exceed maxPrice',
      path: ['minPrice'],
    }),
  params: z.unknown(),
});

export const topSellingQuery = base.extend({
  body: z.unknown(),
  query: paginationQuery.pick({ limit: true }).extend({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    vendorId: optionalNumber,
    categoryId: optionalNumber,
  }),
  params: z.unknown(),
});

export const idParam = base.extend({
  body: z.unknown(),
  query: z.unknown(),
  params: idParams,
});