import { z } from 'zod';

export const AuthorSchema = z.object({
  name: z.string().min(1),
  orcid: z.string().optional(),
});

export type Author = z.infer<typeof AuthorSchema>;
