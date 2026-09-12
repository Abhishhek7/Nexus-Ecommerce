import { z } from 'zod';
const base = z.object({ body: z.unknown(), query: z.unknown(), params: z.unknown() });
export const updateProfile = base.extend({
  body: z.object({ name: z.string().trim().min(2).max(100) }),
  query: z.unknown(), params: z.unknown(),
});
