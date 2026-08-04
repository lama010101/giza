import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import type { Simulation } from '@/schemas/simulation';
import type { Source } from '@/schemas/source';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';

export interface HypothesisContext {
  evidence: Evidence[];
  objects: SceneObject[];
  locations: Location[];
  sources: Source[];
  simulations: Simulation[];
}

export interface HypothesisGeometryNode {
  id: string;
  name: string;
  position: Vector3;
  rotation?: Vector3;
  size: Vector3;
  color: string;
  opacity: number;
  hypothesisId: string;
  evidenceIds: string[];
  metadata?: Record<string, unknown>;
  /** Visibility rules per M11-T20 — when and how this node is visible. */
  visibilityRules?: VisibilityRule[];
}

/**
 * Visibility rule for interpretive objects per M11-T20.
 * Controls when a hypothesis-specific geometry node is visible
 * based on mode, layer, chronology, and evidence state.
 */
export interface VisibilityRule {
  /** The layer/mode this rule applies to. */
  layer?: string;
  /** Required chronology period for visibility. */
  chronologyPeriod?: string;
  /** Minimum evidence count required for visibility. */
  minEvidenceCount?: number;
  /** Whether the node is visible by default. */
  defaultVisible?: boolean;
  /** Conditions that must be met for visibility. */
  conditions?: string[];
  /** LOD level required for visibility. */
  minLOD?: number;
}

export interface HypothesisPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  getHypothesis(context: HypothesisContext): Hypothesis;
  getSimulations?(): Simulation[];
  getVisualizationRules?(objectId: string, context: HypothesisContext): VisualizationRule[];
  getGeometryNodes?(context: HypothesisContext): HypothesisGeometryNode[];
}
