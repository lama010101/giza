/**
 * Plugin entry point for the Hydraulic-Acoustic System Hypothesis.
 *
 * This module re-exports the plugin implementation from the parent
 * directory and loads the separate JSON manifests (hypothesis.json,
 * predictions.json, visualization.json) per M11.5-T01 through T04.
 */

export { gpHydraulicAcousticPlugin as default } from '../gp-hydraulic-acoustic';
export { gpHydraulicAcousticPlugin } from '../gp-hydraulic-acoustic';

import hypothesisData from './hypothesis.json';
import predictionsData from './predictions.json';
import visualizationData from './visualization.json';

export const hypothesisManifest = hypothesisData;
export const predictionsManifest = predictionsData;
export const visualizationManifest = visualizationData;
