import { z } from 'zod';
import { idParams } from './common';
const base = z.object({ body: z.unknown(), query: z.unknown(), params: z.unknown() });
export const categoryCreate = base.extend({
  body: z.object({ name: z.string().trim().min(2).max(191), parentId: z.coerce.number().int().positive().nullable().optional() }),
  query: z.unknown(), params: z.unknown(),
});
export const categoryUpdate = base.extend({
  body: z.object({
    name: z.string().trim().min(2).max(191).optional(),
    parentId: z.coerce.number().int().positive().nullable().optional(),
    status: z.enum(['ACTIVE','INACTIVE']).optional(),
  }).refine(v => Object.keys(v).length > 0, 'At least one field is required'),
  query: z.unknown(), params: idParams,
});
export const categoryId = base.extend({ body: z.unknown(), query: z.unknown(), params: idParams });
