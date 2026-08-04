/**
 * Raycast interaction system per GIZA - 04 §6.17.
 *
 * Supported interactions: Hover, Focus, Inspect, Measure, Bookmark,
 * Compare, Hide Layer, Cross Section, Evidence View, Theory View.
 *
 * Everything uses raycasting.
 */

import type { ThreeEvent } from '@react-three/fiber';
import type { Vector3 } from '@/schemas/location';

export type InteractionType =
  | 'hover'
  | 'focus'
  | 'inspect'
  | 'measure'
  | 'bookmark'
  | 'evidence-view'
  | 'theory-view';

export interface RaycastHit {
  nodeId: string;
  objectId?: string;
  evidenceIds?: string[];
  point: Vector3;
  distance: number;
}

export interface InteractionState {
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  inspectedNodeId: string | null;
  selectedEvidenceId: string | null;
  interactionMode: InteractionType;
}

/**
 * Extracts a raycast hit from a Three.js event object.
 */
export function extractRaycastHit(
  event: ThreeEvent<MouseEvent>,
  nodeId: string,
  metadata?: { objectId?: string; evidenceIds?: string[] },
): RaycastHit {
  return {
    nodeId,
    objectId: metadata?.objectId,
    evidenceIds: metadata?.evidenceIds,
    point: { x: event.point.x, y: event.point.y, z: event.point.z },
    distance: event.distance,
  };
}

/**
 * Determines the interaction type based on current mode and modifiers.
 */
export function resolveInteractionType(
  mode: string,
  measurementMode: boolean,
  shiftKey: boolean,
): InteractionType {
  if (measurementMode) return 'measure';
  if (shiftKey) return 'bookmark';
  if (mode === 'Research') return 'inspect';
  return 'focus';
}

/**
 * Determines whether a click should open the evidence view.
 */
export function shouldOpenEvidenceView(hit: RaycastHit): boolean {
  return !!hit.evidenceIds && hit.evidenceIds.length > 0;
}

/**
 * Determines whether a click should open the theory view.
 */
export function shouldOpenTheoryView(hit: RaycastHit, hasActiveHypotheses: boolean): boolean {
  return !!hit.objectId && hasActiveHypotheses;
}
