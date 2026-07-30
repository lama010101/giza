import {
  getAllEvidence,
  getAllLocations,
  getAllObjects,
  getAllSources,
} from '@/evidence/repository';
import { HypothesisEngine } from './engine';
import {
  osirisHydraulicPlugin,
  osirisMainstreamPlugin,
  gpHydraulicPlugin,
  gpMainstreamPlugin,
  gpHydraulicAcousticPlugin,
  gpScanPyramidsPlugin,
} from './plugins';
import type { HypothesisContext } from './types';

export const hypothesisEngine = new HypothesisEngine();
hypothesisEngine.register(osirisHydraulicPlugin);
hypothesisEngine.register(osirisMainstreamPlugin);
hypothesisEngine.register(gpHydraulicPlugin);
hypothesisEngine.register(gpMainstreamPlugin);
hypothesisEngine.register(gpHydraulicAcousticPlugin);
hypothesisEngine.register(gpScanPyramidsPlugin);

export function getDefaultHypothesisContext(): HypothesisContext {
  return {
    evidence: getAllEvidence(),
    objects: getAllObjects(),
    locations: getAllLocations(),
    sources: getAllSources(),
    simulations: [],
  };
}
