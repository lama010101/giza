import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import type { Simulation } from '@/schemas/simulation';
import type { Source } from '@/schemas/source';
import type { VisualizationRule } from '@/schemas/hypothesis';

export interface HypothesisContext {
  evidence: Evidence[];
  objects: SceneObject[];
  locations: Location[];
  sources: Source[];
  simulations: Simulation[];
}

export interface HypothesisPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  getHypothesis(context: HypothesisContext): Hypothesis;
  getSimulations?(): Simulation[];
  getVisualizationRules?(objectId: string, context: HypothesisContext): VisualizationRule[];
}
