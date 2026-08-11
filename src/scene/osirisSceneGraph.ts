import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { IDENTITY_TRANSFORM, SceneGraph, boundingBoxFromSize } from './sceneGraph';
import type { SurveyReference } from './sceneGraph';
import { MONUMENT_ORIGINS } from './coordinateSystem';

export const OSIRIS_SCENE_ROOT_ID = 'osiris-shaft-scene';

/**
 * Default survey reference for the Osiris Shaft.
 * All nodes inherit this unless overridden.
 */
const DEFAULT_SURVEY_REF: SurveyReference = {
  id: 'SP-OSIRIS-001',
  method: 'total-station',
  date: '2007-01-15',
  surveyor: 'Zahi Hawass team',
  coordinateSystem: 'local',
};

/**
 * Per-layer confidence values per GIZA-03 §2.7.
 */
const LAYER_CONFIDENCE: Record<string, number> = {
  'level-0': 100, // Surface (modern, measured)
  monument: 100, // Root grouping node
  shafts: 98, // Entrance shaft
  'level-1': 96, // Main chambers
  'level-2': 96, // Main chambers
  'level-3': 96, // Main chambers
};

const DEFAULT_CONFIDENCE = 90;

/**
 * Per-node confidence overrides for elements with different certainty.
 * Per GIZA-03 §2.7: water level = variable, conduit = 85, fractures = 80.
 */
const NODE_CONFIDENCE_OVERRIDE: Record<string, number> = {
  'shaft-a': 98,
  'chamber-a': 96,
  'shaft-b': 95,
  'chamber-b': 96,
  'shaft-c': 95,
  'chamber-i': 96,
  'central-island': 92,
  'sarcophagus-i': 88,
  'northern-conduit': 85,
  'chamber-i-water': 50, // variable — estimated
  'niche-2-sarcophagus': 85,
  'niche-7-sarcophagus': 85,
  'chamber-b-east-passage': 80,
  'east-corridor': 75, // partially surveyed
  vault: 80,
  'eastern-tunnel': 65, // partially explored
  'surface-bedrock': 100,
  'surface-desert': 100,
  'surface-excavation-perimeter': 100,
  'surface-entrance': 100,
  'surface-fencing': 100,
  'surface-visitor-path-n': 100,
  'surface-visitor-path-e': 100,
  'surface-reference-marker-1': 100,
  'surface-reference-marker-2': 100,
};

export function buildOsirisSceneGraph(): SceneGraph {
  const graph = new SceneGraph();

  graph.setRootOrigin({ ...MONUMENT_ORIGINS['osiris-shaft'] });

  graph.addNode({
    id: OSIRIS_SCENE_ROOT_ID,
    name: osirisBlockout.name,
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: {
      layer: 'monument',
      surveyReference: DEFAULT_SURVEY_REF,
    },
    visible: true,
  });

  for (const node of osirisBlockout.nodes) {
    const confidence =
      NODE_CONFIDENCE_OVERRIDE[node.id] ?? LAYER_CONFIDENCE[node.layer] ?? DEFAULT_CONFIDENCE;

    graph.addNode({
      id: node.id,
      name: node.name,
      parentId: OSIRIS_SCENE_ROOT_ID,
      localTransform: {
        position: node.position,
        rotation: node.rotation ?? { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: {
        objectId: node.objectId,
        evidenceIds: node.evidenceIds,
        sourceIds: node.sourceIds,
        layer: node.layer,
        confidence,
        boundingBox: boundingBoxFromSize(node.position, node.size),
        surveyReference: DEFAULT_SURVEY_REF,
      },
      visible: true,
    });
  }

  return graph;
}
