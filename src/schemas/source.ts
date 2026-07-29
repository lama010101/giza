import { z } from 'zod';
import { SourceId } from './identifiers';
import { AuthorSchema } from './person';

export const SourceType = z.enum([
  'Book',
  'Journal',
  'Conference',
  'Survey',
  'Archaeological Report',
  'Museum',
  'Government',
  'Video',
  'Photograph',
  'Personal Communication',
]);

export type SourceType = z.infer<typeof SourceType>;

export const SourceSchema = z.object({
  id: SourceId,
  authors: z.array(AuthorSchema).default([]),
  title: z.string().min(1),
  publication: z.string().optional(),
  year: z.number().int().optional(),
  doi: z.string().optional(),
  isbn: z.string().optional(),
  url: z.string().url().optional(),
  license: z.string().optional(),
  type: SourceType,
  reliability: z.number().int().min(0).max(100).optional(),
});

export type Source = z.infer<typeof SourceSchema>;
