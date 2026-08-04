import { z } from 'zod';
import { EvidenceId } from './identifiers';

/**
 * Conflict record and resolution states per GIZA - 08 Evidence Database
 * Specification §1.15.
 *
 * The platform never hides contradictory evidence. Conflicts are recorded
 * explicitly and surface in the UI as red halos and in the Evidence Panel
 * under "Contradictions".
 */
export const ConflictResolutionState = z.enum([
  'unresolved',
  'partial',
  'superseded',
  'contextual',
]);

export type ConflictResolutionState = z.infer<typeof ConflictResolutionState>;

export const ConflictRecordSchema = z.object({
  id: z.string().regex(/^CONF-\d{4}$/, 'Expected CONF-NNNN'),
  evidenceA: EvidenceId,
  evidenceB: EvidenceId,
  relation: z.enum(['contradicts', 'refines', 'supersedes']).default('contradicts'),
  description: z.string().default(''),
  resolution: ConflictResolutionState.default('unresolved'),
  notes: z.string().default(''),
  created: z.string().default(''),
  updated: z.string().default(''),
});

export type ConflictRecord = z.infer<typeof ConflictRecordSchema>;
