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
