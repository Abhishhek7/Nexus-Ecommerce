import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const idParams = z.object({ id: z.coerce.number().int().positive() });
