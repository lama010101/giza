import { z } from 'zod';
import { EvidenceId, LocationId, ObjectId, SourceId } from './identifiers';

export const ObjectType = z.enum([
  'Artifact',
  'Architecture',
  'Environmental',
  'ArchaeologicalFind',
  'InterpretiveObject',
]);

export type ObjectType = z.infer<typeof ObjectType>;

export const ObjectClass = z.enum([
  'Original Architecture',
  'Modern Installations',
  'Environmental Objects',
  'Archaeological Finds',
  'Interpretive Objects',
]);

export type ObjectClass = z.infer<typeof ObjectClass>;

export const ObjectSchema = z.object({
  id: ObjectId,
  name: z.string().min(1),
  type: ObjectType,
  objectClass: ObjectClass,
  mesh: z.string().optional(),
  location: LocationId.optional(),
  confidence: z.number().int().min(0).max(100),
  evidence: z.array(EvidenceId).default([]),
  sourceIds: z.array(SourceId).default([]),
});

export type SceneObject = z.infer<typeof ObjectSchema>;
