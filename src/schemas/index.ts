export * from './identifiers';
export * from './evidence';
export * from './source';
export * from './location';
export * from './object';
export * from './hypothesis';
export * from './prediction';
export * from './simulation';
export * from './annotation';
export * from './media';
export * from './user';
export * from './lifecycle';
export * from './dependency';
export * from './conflict';
export * from './confidence';
export * from './person';

import { z } from 'zod';
import { EvidenceSchema } from './evidence';
import { SourceSchema } from './source';
import { LocationSchema } from './location';
import { ObjectSchema } from './object';
import { HypothesisSchema } from './hypothesis';
import { SimulationSchema } from './simulation';
import { AnnotationSchema } from './annotation';
import { MediaSchema } from './media';
import { UserSchema, BookmarkSchema, MeasurementSchema } from './user';
import { DependencyEdgeSchema } from './dependency';
import { ConflictRecordSchema } from './conflict';

/**
 * Entity kind registry for {@link validateEntity}. Maps a logical kind name
 * to its Zod schema. Keep this in sync with the exports above.
 */
const ENTITY_SCHEMAS = {
  evidence: EvidenceSchema,
  source: SourceSchema,
  location: LocationSchema,
  object: ObjectSchema,
  hypothesis: HypothesisSchema,
  simulation: SimulationSchema,
  annotation: AnnotationSchema,
  media: MediaSchema,
  user: UserSchema,
  bookmark: BookmarkSchema,
  measurement: MeasurementSchema,
  dependencyEdge: DependencyEdgeSchema,
  conflictRecord: ConflictRecordSchema,
} as const;

export type EntityKind = keyof typeof ENTITY_SCHEMAS;

export { ENTITY_SCHEMAS };

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: z.ZodError;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates an entity against the schema registered for `kind`.
 *
 * Returns a discriminated union so callers can narrow without try/catch:
 *
 * ```ts
 * const result = validateEntity('evidence', data);
 * if (result.success) {
 *   const evidence: Evidence = result.data;
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */
export function validateEntity<T = unknown>(kind: EntityKind, data: unknown): ValidationResult<T> {
  const schema = ENTITY_SCHEMAS[kind];
  if (!schema) {
    throw new Error(`Unknown entity kind: ${kind}. Add it to ENTITY_SCHEMAS in schemas/index.ts.`);
  }
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { success: true, data: parsed.data as T };
  }
  return { success: false, error: parsed.error };
}
