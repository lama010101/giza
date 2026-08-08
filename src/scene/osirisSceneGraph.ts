import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { getConceptualLayersForLayer, type ConceptualLayer } from '@/store/app';
import { IDENTITY_TRANSFORM, SceneGraph, boundingBoxFromSize } from './sceneGraph';
import type { SurveyReference } from './sceneGraph';

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
 * Per-layer confidence defaults per GIZA-03 §2.7.
 */
const LAYER_CONFIDENCE: Record<string, number | undefined> = {
  'level-0': 100, // Surface (modern, measured)
  shafts: 98, // Entrance shaft
  'level-1': 96, // Main chambers
  'level-2': 96, // Main chambers
  'level-3': 96, // Main chambers
  monument: 95, // Top-level monument grouping
};

/**
 * Per-node confidence overrides for elements with different certainty.
 * Per GIZA-03 §2.7: water level = variable, conduit = 85, fractures = 80.
 */
const NODE_CONFIDENCE_OVERRIDE: Record<string, number> = {
  'northern-conduit': 85,
  'chamber-i-water': 50, // variable — estimated
  'eastern-tunnel': 65, // partially explored
  'east-corridor': 75, // partially surveyed
  vault: 80,
  'chamber-b-east-passage': 75,
  'niche-2-sarcophagus': 90,
  'niche-7-sarcophagus': 88,
};

/**
 * Extra conceptual layers for hypothesis and content overlays.
 */
const NODE_CONCEPTUAL_LAYER_OVERRIDES: Record<string, ConceptualLayer[]> = {
  'chamber-i-water': ['Water', 'Simulation'],
  'northern-conduit': ['Theory'],
};

export function buildOsirisSceneGraph(): SceneGraph {
  const graph = new SceneGraph();

  graph.addNode({
    id: OSIRIS_SCENE_ROOT_ID,
    name: osirisBlockout.name,
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: {
      layer: 'monument',
      conceptualLayers: getConceptualLayersForLayer('monument'),
      surveyReference: DEFAULT_SURVEY_REF,
    },
    visible: true,
  });

  for (const node of osirisBlockout.nodes) {
    const confidence =
      node.confidence ?? NODE_CONFIDENCE_OVERRIDE[node.id] ?? LAYER_CONFIDENCE[node.layer] ?? 80;

    const baseConceptualLayers = getConceptualLayersForLayer(node.layer);
    const overrideConceptualLayers = NODE_CONCEPTUAL_LAYER_OVERRIDES[node.id] ?? [];
    const conceptualLayers = Array.from(
      new Set([...baseConceptualLayers, ...overrideConceptualLayers]),
    );

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
        conceptualLayers,
        confidence,
        boundingBox: boundingBoxFromSize(node.position, node.size),
        surveyReference: DEFAULT_SURVEY_REF,
      },
      visible: true,
    });
  }

  return graph;
}
