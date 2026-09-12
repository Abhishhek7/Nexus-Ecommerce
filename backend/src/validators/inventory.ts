import { z } from 'zod';
import { idParams } from './common';
const base = z.object({ body: z.unknown(), query: z.unknown(), params: z.unknown() });
export const updateInventory = base.extend({
  body: z.object({ availableQuantity: z.coerce.number().int().min(0).max(1_000_000) }),
  query: z.unknown(), params: idParams,
});
