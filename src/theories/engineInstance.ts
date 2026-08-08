import {
  getAllEvidence,
  getAllLocations,
  getAllObjects,
  getAllSources,
} from '@/evidence/repository';
import { HypothesisEngine } from './engine';
import { discoverAndRegister } from './pluginDiscovery';
import type { HypothesisContext } from './types';

export const hypothesisEngine = new HypothesisEngine();
discoverAndRegister(hypothesisEngine);

export function getDefaultHypothesisContext(): HypothesisContext {
  return {
    evidence: getAllEvidence(),
    objects: getAllObjects(),
    locations: getAllLocations(),
    sources: getAllSources(),
    simulations: [],
  };
}

export { discoverAndRegister };
