import { z } from 'zod';
import { EvidenceId } from './identifiers';

/**
 * Dependency graph edge types per GIZA - 08 Evidence Database Specification
 * §1.10. Evidence forms an explicit directed acyclic graph. Cycles are
 * rejected at insertion time (enforced by the dependency graph store, M02-T05).
 */
export const DependencyRelation = z.enum([
  'validates',
  'supports',
  'contradicts',
  'refines',
  'supersedes',
  'influences',
  'derived_from',
]);

export type DependencyRelation = z.infer<typeof DependencyRelation>;

export const DependencyEdgeSchema = z.object({
  from: EvidenceId,
  to: EvidenceId,
  relation: DependencyRelation,
  strength: z.number().min(0).max(1).default(1),
  notes: z.string().default(''),
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;
