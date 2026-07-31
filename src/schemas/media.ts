import { z } from 'zod';
import { EvidenceId } from './identifiers';

/**
 * Media schema per GIZA - 08 Evidence Database Specification §1.19.
 *
 * Media records are stored separately and linked to evidence. Media without
 * a license declaration cannot be attached to Published evidence (enforced
 * at the API layer, not in the schema).
 */
export const MediaType = z.enum([
  'Photograph',
  'Video',
  'Audio',
  'Scan',
  'Drawing',
  'Plan',
  'Document',
  '3D capture',
]);

export type MediaType = z.infer<typeof MediaType>;

export const MediaId = z.string().regex(/^MED-\d{4}$/, 'Expected MED-NNNN');
export type MediaId = z.infer<typeof MediaId>;

export const MediaSchema = z.object({
  id: MediaId,
  type: MediaType,
  url: z.string().default(''),
  license: z.string().default(''),
  credit: z.string().default(''),
  capturedDate: z.string().default(''),
  capturedBy: z.string().default(''),
  evidenceIds: z.array(EvidenceId).default([]),
});

export type Media = z.infer<typeof MediaSchema>;
